(ns query-service.handler
  (:require
   [query-service.middleware :as middleware]
   [query-service.layout :refer [error-page]]
   [query-service.routes.services :refer [root-route service-routes]]
   [reitit.swagger-ui :as swagger-ui]
   [reitit.ring :as ring]
   [ring.middleware.content-type :refer [wrap-content-type]]
   [ring.middleware.webjars :refer [wrap-webjars]]
   [ring.middleware.cors :refer [wrap-cors]]
   [query-service.env :refer [defaults]]
   [mount.core :as mount]))

(mount/defstate init-app
  :start ((or (:init defaults) (fn [])))
  :stop  ((or (:stop defaults) (fn []))))

(mount/defstate app-routes
  :start
  (ring/ring-handler
   (ring/router
    [(root-route)
     (service-routes)])
   (ring/routes
    (swagger-ui/create-swagger-ui-handler
     {:path   "/swagger-ui"
      :url    "/api/swagger.json"
      :config {:validator-url nil}})
    (ring/create-resource-handler
     {:path "/"})
    (wrap-content-type
     (wrap-webjars (constantly nil)))
    (ring/create-default-handler
     {:not-found
      (constantly (error-page {:status 404, :title "404 - Page not found"}))
      :method-not-allowed
      (constantly (error-page {:status 405, :title "405 - Not allowed"}))
      :not-acceptable
      (constantly (error-page {:status 406, :title "406 - Not acceptable"}))}))))

(defn app []
  (->
   #'app-routes
  ;  (wrap-cors :access-control-allow-origin [#"*"]
  ;             :access-control-allow-methods [:get :put :post :delete])
   (middleware/wrap-base)))

