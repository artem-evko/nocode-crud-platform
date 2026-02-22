package com.nocode.platform.config;

import liquibase.integration.spring.SpringLiquibase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class LiquibaseConfig {

    @Bean
    public SpringLiquibase liquibase(DataSource dataSource) {
        SpringLiquibase lb = new SpringLiquibase();
        lb.setDataSource(dataSource);

        // путь к твоему master changelog
        lb.setChangeLog("classpath:db/changelog/db.changelog-master.yaml");

        // обязательно запускаем
        lb.setShouldRun(true);

        return lb;
    }
}