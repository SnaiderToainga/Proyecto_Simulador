# 🏦 Simulador de Créditos - UTA (Fase 1)

Sistema interactivo de simulación de amortizaciones crediticias desarrollado para la Carrera de Software de la **Universidad Técnica de Ambato**. Este proyecto implementa autenticación basada en tokens, servicios desacoplados en el backend y una interfaz cliente reactiva estructurada para migrar a una arquitectura de microservicios.

---

## 🚀 Tecnologías Utilizadas

* **Frontend:** React (Vite) + JavaScript
* **Backend:** .NET 10 (ASP.NET Core Web API)
* **Base de Datos:** SQL Server Express (Entity Framework Core)
* **Seguridad:** Autenticación JWT (JSON Web Tokens)
* **Generación de Reportes:** jsPDF + jspdf-autotable

---

## 📦 Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado en tu máquina:
1. [.NET 10 SDK](https://dotnet.microsoft.com/download)
2. [Node.js (versión LTS)](https://nodejs.org/) y npm
3. [SQL Server Express](https://www.microsoft.com/sql-server/sql-server-downloads) y [SSMS](https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms)
4. [Git](https://git-scm.com/)

---

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio

git clone <URL_DEL_REPOSITORIO>
cd ProyectoSimulador

## 2. Configuración del Backend (.NET 10)
Entra a la carpeta del backend:
cd BackendApi

Verifica o restaura los paquetes NuGet necesarios:

dotnet restore
(Dependencias utilizadas: Microsoft.EntityFrameworkCore.SqlServer, Microsoft.EntityFrameworkCore.Tools, Microsoft.AspNetCore.Authentication.JwtBearer).

Revisa la cadena de conexión en appsettings.json:

JSON
"ConnectionStrings": {
  "DefaultConnection": "Server=.\\SQLEXPRESS;Database=SimuladorCreditoDB;Trusted_Connection=True;TrustServerCertificate=True;"
}
Aplica las migraciones para crear la base de datos localmente:
dotnet ef database update

Ejecuta el servidor API:
dotnet run
El backend quedará escuchando en http://localhost:5083.

## 3.3. Configuración del Frontend (React + Vite)
Abre una nueva terminal y navega a la carpeta del frontend:
cd frontend

Instala las dependencias del proyecto (incluyendo librerías de PDF):
npm install
npm install jspdf jspdf-autotable

Inicia el servidor de desarrollo:
npm run dev
La aplicación estará disponible en http://localhost:5173 o http://localhost:5174.

## 🔑 Credenciales de Prueba (JWT)
Para ingresar al simulador se implementó un login inicial con credenciales quemadas:

Usuario: admin
Contraseña: 12345

Al validar, la API entrega un token Bearer que protege los endpoints de cálculo.

📋 Funcionalidades Implementadas (Fase 1)
Seguridad: Rutas protegidas mediante middleware de JWT ([Authorize]).

Reglas de Amortización:

Sistema Francés: Cuotas fijas mensuales con interés y seguro calculados sobre saldo.

Sistema Alemán: Amortización de capital constante con cuota total decreciente.

Tipos de Crédito:

Preciso: 15.60% de interés anual con plazos mensuales continuos (hasta 48 meses).

Hipotecario Vivienda: 8.50% de interés anual con plazos en años (3 a 20 años).

Vivienda de Interés Público: 4.99% de interés anual con plazos de 20 a 25 años.

Educación Superior: 9.50% de interés anual con plazos semestrales/anuales.

Seguro de Desgravamen: Cálculo dinámico sobre saldo insoluto integrado a la cuota mensual.

Formateo inteligente de plazos: Desglose automático en años y meses (ej. 1 año y 1 mes, 2 años).

Exportación: Modal emergente con desglose tabla y descarga directa en formato PDF.

