FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy the pom structure
COPY pom.xml .
COPY generator-core/pom.xml generator-core/
COPY platform-web/pom.xml platform-web/

# Download dependencies (this step is cached if poms don't change)
RUN mvn dependency:go-offline -B -DskipTests

# Copy source code
COPY generator-core/src generator-core/src
COPY platform-web/src platform-web/src

# Build the application
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Install Docker CLI and Docker Compose Plugin
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli docker-buildx-plugin docker-compose-plugin

COPY --from=build /app/platform-web/target/platform-web-1.0-SNAPSHOT.jar app.jar

# Run the jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
