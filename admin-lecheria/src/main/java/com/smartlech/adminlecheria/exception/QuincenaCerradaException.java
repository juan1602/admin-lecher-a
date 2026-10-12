package com.smartlech.adminlecheria.exception;

// Se lanza al intentar crear, editar o borrar datos de una quincena cerrada → 423
public class QuincenaCerradaException extends RuntimeException {
    public QuincenaCerradaException(String mensaje) {
        super(mensaje);
    }
}
