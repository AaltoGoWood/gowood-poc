(ns query-service.model.holochain
  (:require [org.httpkit.client :as http]
            [clojure.data.json :as json]))

(def url "http://localhost:8888")

(def call-config {"instance_id" "test-instance-2"
                  "zome" "gowood_key"})

(defn parse-asset-id [{:keys [body] :as http-response}]
  (-> body
      json/read-str
      (get "result")
      json/read-str
      (get "Ok")))

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
