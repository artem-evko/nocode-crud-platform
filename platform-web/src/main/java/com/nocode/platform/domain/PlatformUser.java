package com.nocode.platform.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * JPA-сущность пользователя платформы.
 *
 * <p>Хранит учётные данные (логин, хэш пароля) и роль
 * для аутентификации через Spring Security.</p>
 */
@Entity
@Table(name = "platform_users")
@Getter
@Setter
public class PlatformUser {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private String username;

    private String password;

    private String role;
}
