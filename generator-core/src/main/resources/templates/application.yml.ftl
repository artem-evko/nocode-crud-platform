server:
  port: 8080
spring:
  application:
    name: ${artifactId}
  datasource:
    url: jdbc:postgresql://localhost:5432/${artifactId}
    username: postgres
    password: password
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true