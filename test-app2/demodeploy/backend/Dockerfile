FROM maven:3.9.6-eclipse-temurin-21-alpine AS BUILD
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline || true
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=BUILD /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
