# Gestor de Inventario y Ventas POS con IA

Una aplicación móvil completa, desarrollada con **React Native (Expo)**, diseñada para ayudar a pequeños negocios a gestionar su inventario y registrar ventas de una manera simple y eficiente.

La característica principal de esta app es su capacidad para **procesar pedidos de texto (ej. de WhatsApp) usando la API de Google Gemini**, automatizando la carga de ventas y minimizando errores manuales.

![Imagen de la App](https://i.imgur.com/YOUR_IMAGE_ID.png) 
*(Reemplaza esta URL con una captura de pantalla de tu app)*

---

## ✨ Características Principales

* **Gestión de Inventario:**
    * Añadir, editar y eliminar productos.
    * Control de stock en tiempo real.

* **Punto de Venta (POS):**
    * Interfaz simple para cargar nuevas ventas.
    * El stock se descuenta automáticamente con cada venta.

* **Procesamiento con IA (Google Gemini):**
    * Copia un pedido de WhatsApp, pégalo en la app y el carrito se llenará automáticamente.
    * El modelo de lenguaje interpreta el texto para identificar productos y cantidades.

* **Historial y Reportes:**
    * Visualiza un historial completo de todas las ventas.
    * Anula ventas con restitución automática de stock.
    * Exporta el inventario y el reporte de ventas a un archivo **Excel (.xlsx)**.

* **Persistencia Local:**
    * Todos tus datos se guardan de forma segura en el dispositivo usando `AsyncStorage`.

* **Interfaz Moderna:**
    * Diseño limpio, intuitivo y fácil de usar, enfocado en la experiencia de usuario.

---

## 🛠️ Tecnologías Utilizadas

* **React Native (Expo)**
* **React Navigation** para la gestión de rutas.
* **Google Gemini API** para el procesamiento de lenguaje natural.
* **AsyncStorage** para el almacenamiento local.
* Librerías de Expo: `expo-clipboard`, `expo-sharing`, `expo-file-system`.

---

## 🚀 Puesta en Marcha

Sigue estos pasos para ejecutar el proyecto en tu entorno local.

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/tu-repositorio.git](https://github.com/tu-usuario/tu-repositorio.git)
    ```

2.  **Instalar dependencias:**
    ```bash
    cd tu-repositorio
    npm install
    ```

3.  **Configurar la API Key de Gemini:**
    * Para que la función de procesamiento de pedidos funcione, necesitas una API key de Google AI Studio.
    * Obtén tu clave gratuita en [**aistudio.google.com/app/apikey**](https://aistudio.google.com/app/apikey).
    * Abre el archivo `NewSaleScreen.js` (o `App.js` si no lo has separado) y pega tu clave en la siguiente línea:
        ```javascript
        const apiKey = "AQUÍ_VA_TU_API_KEY";
        ```

4.  **Iniciar la aplicación:**
    ```bash
    npx expo start
    ```
    Escanea el código QR con la app de Expo Go en tu dispositivo móvil.
