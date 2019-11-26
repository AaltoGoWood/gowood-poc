FROM openjdk:8-alpine

COPY target/uberjar/query-service.jar /query-service/app.jar

EXPOSE 3000

CMD ["java", "-jar", "/query-service/app.jar"]
