package com.newtin.eco.exception;
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) { super(message); }
}