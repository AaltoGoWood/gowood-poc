(ns query-service.model.holochain
  (:require [org.httpkit.client :as http]
            [clojure.data.json :as json]))

(def holochain-access-config {"instance_id" "test-instance-1"
                              "zome" "gowood_key"
                              "function" "get_value_from_key"})



(defn parse-asset-id [{:keys [body] :as http-response}]

  (-> body
      json/read-str
      (get "result")
      json/read-str
      (get-in ["Ok" "App"])
      second
      json/read-str))

(def hc-key "H0tq8cS3MdqGBy6pD7bNBJHXIayOjAlQe4YIjjkAuJThwoeWZ9b6Y23SGQpLtzaQPLt4OZHzQkSD+fYxRfF+06/7GUy7xe1bl+q8UHCANu7cTC9VbUA=")

(defn fetch-asset-id
  ;; Key = holochain entry address encrypted by the agent we are calling
  [holochain-key & [config]]
  (let [conf (merge holochain-access-config config)]
    ;;(println (format  "key: %s config: %s" holochain-key conf))
    (let [url "http://localhost:8888"
          body (json/write-str
                {:id "0"
                 :jsonrpc "2.0"
                 :method "call"
                 :params (merge conf
                                {"args" {"key" holochain-key}})})
          options {:headers {"Content-Type" "application/json"}
                   :body body}
          {:keys [status] :as response} @(http/post url options)]

      (case status
        200 (parse-asset-id response)
        {:status status :msg (format "Error HTTP response. Status %s" status)}))))
