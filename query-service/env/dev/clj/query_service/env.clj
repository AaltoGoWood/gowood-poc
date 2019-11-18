(ns query-service.env
  (:require
    [selmer.parser :as parser]
    [clojure.tools.logging :as log]
    [query-service.dev-middleware :refer [wrap-dev]]))

(def defaults
  {:init
   (fn []
     (parser/cache-off!)
     (log/info "\n-=[query-service started successfully using the development profile]=-"))
   :stop
   (fn []
     (log/info "\n-=[query-service has shut down successfully]=-"))
   :middleware wrap-dev})
