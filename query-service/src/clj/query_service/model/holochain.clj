(ns query-service.model.holochain
  (:require [org.httpkit.client :as http]
            [clojure.data.json :as json]
            [clojure.walk :refer [keywordize-keys]]))

(def url "http://localhost:8888")

(def call-config {"instance_id" "test-instance-2"
                  "zome" "gowood_key"})

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
  [id type attrs & rows]
  (let [conf (merge call-config {"function" "create_signed_token_for_value"})
        args {"value" {"id" id "type" type "attributes" attrs "rows" (vec rows)}}]
    (println args)
    (call-holochain-api url args conf parse-create-key-from-value-response)))

(defn fetch-asset-id
  ;; Key = holochain entry address encrypted by the agent we are calling
  [holochain-key]
  (let [conf (merge call-config {"function" "get_value_from_signed_token"})]
    (call-holochain-api url {"token" holochain-key} conf parse-asset-id)))

(defn holo-row? [{:keys [type]}]
  (= type "holochain-link"))

(defn ->normal-data-row [{:keys [type id] :as row}]
  (let [{:keys [status] :as holochain-record} (fetch-asset-id id)]
    (when-not (= :error status)
      (let [{original-id :id original-type :type attributes :attributes} holochain-record ]
        (merge attributes
               {:id id
                :type type
                :original-id original-id
                :original-type original-type})))))

;; (defn ->normal-data-attributes [{{:keys [type id] :as attrs}}]
;;   (let [{original-id :id original-type :type attributes :attributes} holochain-record]
;;     (merge attributes
;;            {:id id
;;             :type type
;;             :original-id original-id
;;             :original-type original-type})))

(defn with-data-from-holochain [{:keys [rows attributes] :as data}]
  (-> data
      (assoc :rows (map ->normal-data-row (map (fn [hash] {:id hash :type "holochain-link"}))))
      (assoc :attributes (->normal-data-row attributes))))

(defn apply-command [op body]
  (let [{{id :id type :type} :from} body
        ;;data-raw (get-node-with-components type id)
        ;;data (with-data-from-holochain data-raw)
        ;;
        data-raw (fetch-asset-id id)
        data (with-data-from-holochain data-raw)
        found? (some? data)

        ]
    (println "result data: " data)
    (println "ogre -> id: " id "; type: " type "; found " found?)
    {:req {:op op :body body}
     :result {:found found?
              :data data}
     :external-nodes []}))
