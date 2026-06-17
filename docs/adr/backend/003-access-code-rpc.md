---
id: 003
title: Validación de código de acceso via RPC en Supabase
date: 2026-06-17
status: accepted
---

## Contexto

La quiniela es de acceso privado: solo los participantes con un código de acceso pueden registrarse. El código debe validarse antes de permitir que el usuario cree una cuenta. La primera implementación usaba una variable de entorno en el frontend (`VITE_ACCESS_CODE`) comparada directamente en el cliente.

## Decisión

Mover la validación del código de acceso a una función RPC en Supabase:

```sql
CREATE OR REPLACE FUNCTION check_access_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM access_codes WHERE code = p_code AND active = true
  );
END;
$$;
```

La tabla `access_codes` tiene RLS habilitado sin políticas de SELECT para el rol `anon`/`authenticated`, lo que impide el acceso directo a su contenido. La función se llama desde el cliente en dos momentos del flujo de registro:

1. Al hacer clic en "Continuar" (paso de validación del código).
2. Al hacer clic en "Crear cuenta" (paso de registro final), como segunda validación.

## Alternativas consideradas

**Variable de entorno en el frontend (`VITE_ACCESS_CODE`)**: se descartó porque Vite embebe las variables de entorno con prefijo `VITE_` directamente en el bundle de JavaScript. Cualquier persona puede inspeccionarlo con las herramientas de desarrollo del navegador o haciendo `curl` al bundle, obteniendo el código sin necesitar acceso legítimo.

**Validación en una Edge Function de Supabase**: se consideró pero se descartó en favor de la RPC porque la RPC con `SECURITY DEFINER` logra el mismo aislamiento de datos directamente en la base de datos, sin necesidad de deployar y mantener una función separada.

**Código de acceso único hardcodeado en la base de datos sin tabla**: se descartó porque una tabla `access_codes` permite revocar o agregar códigos sin cambiar código ni hacer redeploy.

## Consecuencias

- El código de acceso nunca aparece en el bundle de JavaScript ni en las herramientas de desarrollo del navegador.
- La tabla `access_codes` puede tener múltiples códigos activos o inactivos, lo que permite gestionar accesos por grupos o revocar códigos comprometidos sin redeploy.
- La doble validación (en "Continuar" y en "Crear cuenta") añade una pequeña latencia de red extra en el flujo de registro, lo cual es aceptable dado que es un flujo de baja frecuencia.
- Si la función RPC cambia de firma, el cliente debe actualizarse. No es una API versionada.
- `SECURITY DEFINER` implica que la función se ejecuta con los permisos del propietario de la función (generalmente `postgres`), por lo que debe escribirse con cuidado para evitar SQL injection (el parámetro `p_code` se usa en una query parametrizada, no en SQL dinámico).
