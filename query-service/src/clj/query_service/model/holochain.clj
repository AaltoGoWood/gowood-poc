(ns query-service.model.holochain
  (:require [org.httpkit.client :as http]
            [clojure.edn :as edn]
            [clojure.data.json :as json]
            [clojure.walk :refer [keywordize-keys]]
            [config.core :refer [env]]))

(def call-config (:holochain-call-config env))

(defn parse-asset-id [{:keys [body] :as http-response}]
  (-> body
      json/read-str
      (get "result")
      json/read-str
      (get "Ok")
      keywordize-keys))

(defn parse-create-key-from-value-response [{:keys [body] :as http-response}]
  (println body)
  (-> body
      json/read-str
      (get "result")
      json/read-str
      (get-in ["Ok"])))

(defn call-holochain-api
  [url args config on-response]
  (println ">> call-holochain-api url: " url " args: " args " config: " config)
  (let [conf (merge call-config config)
        body (json/write-str
              {:id "0"
               :jsonrpc "2.0"
               :method "call"
               :params (merge conf {"args" args})})
        options {:headers {"Content-Type" "application/json"}
                 :body body}
        {:keys [status] :as response} @(http/post url options)]

    (case status
      200 (on-response response)
      {:http-status status :status :error :msg (format "Error HTTP response. Status %s" status)})))

(defn add-asset!
  [type id attrs & rows]
  (let [conf (merge call-config {"function" "create_signed_token_for_value"})
        args {"value" {"id" id "type" type "attributes" attrs "rows" (vec rows)}}]
    (println args)
    (call-holochain-api (:holochain-url env) args conf parse-create-key-from-value-response)))

(defn fetch-asset-id
  ;; Key = holochain entry address encrypted by the agent we are calling
  [holochain-key]
  (let [conf (merge call-config {"function" "get_value_from_signed_token"})]
    (call-holochain-api (:holochain-url env) {"token" holochain-key} conf parse-asset-id)))

(defn holo-row? [{:keys [type]}]
  (= type "holochain-link"))

(defn- parse-coords [coordStr]
  (let [[lng lat] (clojure.string/split coordStr #",[ ]?")]
    (if (and lng lat)
      {:lng (edn/read-string lng) :lat (edn/read-string lat)}
      nil)))

(declare normalize-object)
(defn- normalize-value [k v]
  (cond
    (= k :coords) (parse-coords v)
    :else v))

(defn normalize-object [obj]
  (into {}
        (map (fn [[k v]] [k (normalize-value k v)]) obj)))


(defn ->normal-data-row [token]
  (let [{:keys [status] :as holochain-record} (fetch-asset-id token)]
    (when-not (= :error status)
      (let [{original-id :id original-type :type attributes :attributes} holochain-record ]
        (merge (normalize-object attributes)
               {:id token
                :type "holochain-link"
                :original_id original-id
                :original_type original-type})))))

(defn ->normal-data-attributes
  [id
   type
   {original-type :type original-id :id attributes :attributes }]
  (merge (normalize-object attributes)
         {:id id
          :type type
          :original_id original-id
          :original_type original-type}))

(defn with-data-from-holochain [requested-id
                                requested-type
                                {:keys [rows] :as data}]
  (-> data
      (assoc :id requested-id)
      (assoc :type requested-type)
      (assoc :rows (map ->normal-data-row rows))
      (assoc :attributes (->normal-data-attributes
                          requested-id
                          requested-type
                          data))))

(defn apply-command [op body]
  (let [{{id :id type :type} :from} body
        data-raw (fetch-asset-id id)
        data (with-data-from-holochain id type data-raw)
        found? (some? data)
        ]
    (println "result data: " data)
    (println "holochain -> id: " id "; type: " type "; found " found?)
    {:req {:op op :body body}
     :result {:found found?
              :data data}
     :external-nodes []}))
