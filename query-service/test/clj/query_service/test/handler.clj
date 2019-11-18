(ns query-service.test.handler
  (:require
    [clojure.test :refer :all]
    [ring.mock.request :refer :all]
    [query-service.handler :refer :all]
    [query-service.middleware.formats :as formats]
    [muuntaja.core :as m]
    [mount.core :as mount]))

(defn parse-json [body]
  (m/decode formats/instance "application/json" body))

(use-fixtures
  :once
  (fn [f]
    (mount/start #'query-service.config/env
                 #'query-service.handler/app-routes)
    (f)))

(deftest test-app
  (testing "main route"
    (let [response ((app) (request :get "/"))]
      (is (= 302 (:status response)))))

  (testing "query tree-trunk"
    (let [response ((app) (-> (request :post "/api/query/")
                              (json-body {:operation "info-with-first-level-components" :from {:type "tree-trunk" :id "p123-1" }})))]
      (is (= 200 (:status response)))))


  (testing "not-found route"
    (let [response ((app) (request :get "/invalid"))]
      (is (= 404 (:status response))))))

;  (testing "services"
;    (testing "success"
;      (let [response ((app) (-> (request :post "/query/math/plus")
;                                (json-body {:x 10, :y 6})))]
;        (is (= 200 (:status response)))
;        (is (= {:total 16} (m/decode-response-body response)))))
; (testing "parameter coercion error"
;   (let [response ((app) (-> (request :post "/query/math/plus")
;                             (json-body {:x 10, :y "invalid"})))]
;     (is (= 400 (:status response)))))

; (testing "response coercion error"
;   (let [response ((app) (-> (request :post "/query/math/plus")
;                             (json-body {:x -10, :y 6})))]
;     (is (= 500 (:status response)))))

; (testing "content negotiation"
;   (let [response ((app) (-> (request :post "/query/math/plus")
;                             (body (pr-str {:x 10, :y 6}))
;                             (content-type "application/edn")
;                             (header "accept" "application/transit+json")))]
;     (is (= 200 (:status response)))
;     (is (= {:total 16} (m/decode-response-body response)))))
