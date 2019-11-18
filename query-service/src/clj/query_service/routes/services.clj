(ns query-service.routes.services
  (:require

   [reitit.swagger :as swagger]
   [reitit.swagger-ui :as swagger-ui]
   [reitit.ring.coercion :as coercion]
   [reitit.coercion.spec :as spec-coercion]
   [reitit.ring.middleware.muuntaja :as muuntaja]
   [reitit.ring.middleware.multipart :as multipart]
   [reitit.ring.middleware.parameters :as parameters]
   [query-service.middleware.formats :as formats]
   [query-service.middleware.exception :as exception]
   [query-service.model.fake-db :as fake-db]
   [ring.util.http-response :refer :all]
   [clojure.spec.alpha :as s]
   [ring.util.response :refer [redirect]]
   [clojure.java.io :as io]))

(s/def ::operations #{"origins" "info-with-first-level-components"})

(s/def ::type string?)
(s/def ::id string?)
(s/def ::from (s/keys :req-un [::type ::id]))
(s/def ::operations-body (s/keys :opt-un [::from ]))

(defn root-route [] 
  ["/" {:get (constantly (redirect "/api/api-docs/" 302))}])

(defn service-routes []
  ["/api"
   {:coercion spec-coercion/coercion
    :muuntaja formats/instance
    :swagger {:id ::api}
    :middleware [;; query-params & form-params
                 parameters/parameters-middleware
                 ;; content-negotiation
                 muuntaja/format-negotiate-middleware
                 ;; encoding response body
                 muuntaja/format-response-middleware
                 ;; exception handling
                 exception/exception-middleware
                 ;; decoding request body
                 muuntaja/format-request-middleware
                 ;; coercing response bodys
                 coercion/coerce-response-middleware
                 ;; coercing request parameters
                 coercion/coerce-request-middleware
                 ;; multipart
                 multipart/multipart-middleware]}

   ;; swagger documentation
   ["" {:no-doc true
        :swagger {:info {:title "GoWood backend APIs"
                         :description ""}}}

    ["/swagger.json"
     {:get (swagger/create-swagger-handler)}]

    ["/api-docs/*"
     {:get (swagger-ui/create-swagger-ui-handler
            {:url "/api/swagger.json"
             :config {:validator-url nil}})}]]
   
   ["/ping"
    {:get (constantly (ok {:message "pong"}))}]

   ["/query"
    {:swagger {:tags ["query-api"]}}
    ["/:operation"
    {:post {:summary "Run named query starting from a node"
            :parameters {:path {:operation ::operations }
                         :body ::operations-body}
            ;; :responses {200 {:body }}
            :handler (fn [{:keys [parameters]}]
                       (let [op (get-in parameters [:path :operation])
                             cmd-body (get-in parameters [:body])]
                       (ok (fake-db/apply-command op cmd-body))))}}     
     ]]])

