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
   [query-service.model.ogre-db :as ogre-db]
   [query-service.model.holochain :as holochain]
   [ring.util.http-response :as res]
   [clojure.spec.alpha :as s]
   [ring.util.response :refer [redirect]]
   [clojure.java.io :as io]))

(s/def ::operations #{"origins" "info-with-first-level-components" "info-with-first-level-components-fake" })

(s/def ::type string?)
(s/def ::id string?)
(s/def ::from (s/keys :req-un [::type ::id]))
(s/def ::operations-body (s/keys :opt-un [::from ]))

(s/def :upload/type #{"entity" "edge"})
(s/def :upload/node-type string?) ;;Supported #{"building" "plywood" "tree-trunk"}
(s/def :upload/node-id string?)
(s/def :upload/from string?)
(s/def :upload/to string?)
(s/def :upload/attributes (s/map-of string? (s/or :s string? :i int? :b boolean?)))
(s/def :upload/add-entity (s/keys :req-un [:upload/node-type :upload/node-id] :opt-un [:upload/attributes]))
(s/def :upload/compose-of (s/keys :req-un [:upload/from :upload/to]))
(s/def :upload/entities (s/coll-of :upload/add-entity))
(s/def :upload/composed-of-edges (s/coll-of :upload/compose-of))
(s/def :upload/body (s/keys :opt-un [:upload/entities :upload/composed-of-edges]))

(defn root-route []
  ["/" {:get (constantly (redirect "/api/api-docs/" 302))}])

(defn apply-command [op cmd-body ok-fn bad-request-fn]
  (let [{{type :type} :from} cmd-body
        datasource-type (case op
                          "info-with-first-level-components-fake" :mock
                          :real)
        root-backend (case type
                       "holochain-link" :holochain
                       :graph-db)
        node-data (case [datasource-type root-backend]
                    [:fake :graph-db] (fake-db/apply-command op cmd-body)
                    [:fake :holochain] (fake-db/apply-command op cmd-body)
                    [:real :graph-db] (ogre-db/apply-command op cmd-body)
                    [:real :holochain] (holochain/apply-command op cmd-body))]
    (println "foobar")
    (cond (= node-data :invalid-query) (bad-request-fn)
          :else (ok-fn node-data))))

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
    {:get (constantly (res/ok {:message "pong"}))}]

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
                          (println (format "/query op %s cmd body: %s " op cmd-body))
                          (apply-command op cmd-body res/ok res/bad-request)))}}]]

   ["/data"
    {:swagger {:tags ["data"]}}
    ["/upload"
     {:post {:summary "Add a data set to the db"
             :parameters {:body :upload/body}
             :handler (fn [{{{:keys [entities composed-of-edges] :as body} :body} :parameters}]
                        (let [entities (map #(assoc % :type "entity") entities)
                              edges    (map #(assoc % :type "edge") composed-of-edges)
                              data     (concat entities edges)]
                          (println "Request data: " body)
                          (println "data to be added to the db: " entities)
                          (ogre-db/add-data data))
                        (println "Data added to the db")
                        (res/ok "ok"))}}]]

   ["/db"
    {:swagger {:tags ["POC admin"]}}
    ["/janus-graph"
     {:delete {:summary "Delete all data from data base"
               :handler (fn [& _]
                          (println "Removing db")
                          (ogre-db/reset-graph)
                          (println "db removed")
                          (res/ok "ok"))}
      :post {:summary "Create new database"
             :handler (fn [& _]
                        (println "Seeding db")
                        (ogre-db/init-poc-graph-with-holodata)
                        (println "db seeded")
                        (res/ok "ok"))}}]]])

