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


;; p123
;; (def hc-key "H0tq8cS3MdqGBy6pD7bNBJHXIayOjAlQe4YIjjkAuJThwoeWZ9b6Y23SGQpLtzaQPLt4OZHzQkSD+fYxRfF+06/7GUy7xe1bl+q8UHCANu7cTC9VbUA=")

;; p124
(def p124-key "QK1FK69yPtTTqio3DWE0Neo1253hHzIWXnvwcTlSN2mRUEQJdidT3Eek9KB49PKJ3AhTSIXoXTqHf+YLQhwFtoqX8vbVYiM7LWpPL+YLnTU/56iNk5o=")


;; pholo1
(def hc-key "ncdOClS5lyuNURzArml3TmsGAbwMHEWyP5tV58+B/vLXC4uh9hq0AnlfClyQW/qVVBN6VXGR/aP0LhgXkdtJtFJ3ccK/LI6c+9kenohSVR89WEC9Vnk=")


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
        {:http-status status :status :error :msg (format "Error HTTP response. Status %s" status)}))))
