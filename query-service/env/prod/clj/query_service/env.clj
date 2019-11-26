(ns query-service.env
  (:require [clojure.tools.logging :as log]))

(def defaults
  {:init
   (fn []
     (log/info "\n-=[query-service started successfully]=-"))
   :stop
   (fn []
     (log/info "\n-=[query-service has shut down successfully]=-"))
   :middleware identity})
