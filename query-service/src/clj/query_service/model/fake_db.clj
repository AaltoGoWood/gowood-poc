(ns query-service.model.fake-db)

(defn ->entity [attributes & rows]
  { :attributes attributes :rows (or rows [])}
  )

(def db {
    "building" {
        "746103" (->entity
            {}
            { :type "plywood" :id "p123" :producer "UPM Plywood" }
            { :type "plywood" :id "p124" :producer "UPM Plywood" }
            { :type "plywood" :id "p125" :producer "UPM Plywood" }
        )
    }
    "plywood" {
        "p123" (->entity
            {}
            {
                :type "tree-trunk"
                :id "p123-1"
                :coords { :lng 25.474273614, :lat 65.0563745 }
            },
            {
                :type "tree-trunk"
                :id "p123-2"
                :coords { :lng 25.474293614, :lat 65.0543745 }
            }
        ),
        "p124" (->entity
            {}
            {
                :type "tree-trunk"
                :id "p124-1"
                :coords { :lng 25.474243614, :lat 65.0503745 }
            }
        ),
        "p125" (->entity
            {}
            {
                :type "tree-trunk"
                :id "p125-1"
                :coords { :lng 25.474203614, :lat 65.0560745 }
            }
        )
    }
    "tree-trunk" {
        "p123-1" (->entity {
            "Species of Tree" "Pine"
            "Trunk width" 60
            "Timestamp" "2019-10-14T09:12:13.012Z"
            "Length" 12
            "Coordinates" "25.474293614, 65.0543745"
        })
        "p123-2" (->entity {
            "Species of Tree" "Pine"
            "Trunk width" 75
            "Timestamp" "2019-10-14T09:12:13.012Z"
            "Length" 20
            "Coordinates" "25.474293614, 65.0543745"
        })
        "p124-1" (->entity {})
        "p125-1" (->entity {})}})

(defn apply-command [op body]
  (let [{{id :id type :type} :from } body
        data (get-in db [type id])
        found? (some? data)]
    (println (str "id: " id "type: " type))
    {:req {:op op :body body}
     :result {:found found?
              :data data}
     :external-nodes []}))