# 🏦 Simulador de Créditos Institucional - Arquitectura de Microservicios

Sistema web financiero desarrollado bajo una arquitectura orientada a **Microservicios** con desacoplamiento de dominio, persistencia independiente (**Database-per-Service**), autenticación distribuida sin estado (**Stateless JWT**) y orquestación directa desde el cliente web.

---

## 📌 Tabla de Contenidos
1. [Descripción General](#-descripción-general)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Estructura del Repositorio](#-estructura-del-repositorio)
5. [Requisitos Previos](#-requisitos-previos)
6. [Instalación y Configuración Local](#-instalación-y-configuración-local)
7. [Ejecución del Proyecto](#-ejecución-del-proyecto)
8. [Verificación de la Base de Datos (SSMS)](#-verificación-de-la-base-de-datos-ssms)
9. [Defensa Técnica y Preguntas Frecuentes](#-defensa-técnica-y-preguntas-frecuentes)

---

## 📖 Descripción General

La aplicación permite cotizar productos de crédito institucionales (Crédito Preciso, Vivienda, Inmobiliario VIP y Educación) aplicando los sistemas de amortización **Francés** (cuota fija) y **Alemán** (abono a capital constante)[cite: 13], integrando el cálculo del **Seguro de Desgravamen**. 

El sistema implementa persistencia inmutable de cotizaciones para auditoría bancaria, tratamiento de la tabla detallada de amortización como **dato derivado** en memoria, y exportación ligera a documento impreso/PDF nativo[cite: 4, 11].

---

## 🏛 Arquitectura del Sistema

  ┌──────────────────────────────────────────┐
                  │             Frontend (React)             │
                  │          http://localhost:5173           │
                  └─────────────┬──────────────┬─────────────┘
                                │              │
               1. Login (Creds) │              │ 2. Simulación (JWT + Payload)
                                ▼              ▼
   ┌───────────────────────────────┐        ┌───────────────────────────────┐
   │          AuthService          │        │       SimuladorService        │
   │     http://localhost:5001     │        │     http://localhost:5002     │
   └───────────────┬───────────────┘        └───────────────┬───────────────┘
                   │                                        │
                   ▼                                        ▼
         ┌───────────────────┐                    ┌───────────────────┐
         │      AuthDB       │                    │    SimuladorDB    │
         │ (SQL Server Exp.) │                    │ (SQL Server Exp.) │
         └───────────────────┘                    └───────────────────┘

* **Separación de Responsabilidades:** `AuthService` es responsable exclusivo del registro y validación de identidad; `SimuladorService` encapsula el motor financiero y la persistencia de cotizaciones.
* **Stateless JWT:** Los microservicios no se comunican directamente por red ni comparten tablas. Comparten una clave criptográfica simétrica configurada en sus respectivos entornos[cite: 2].
* **Database-per-Service:** Cada microservicio posee su propia base de datos física en SQL Server Express (`AuthDB` y `SimuladorDB`), impidiendo acoplamientos a nivel de datos[cite: 3].

---

## 💻 Stack Tecnológico

* **Frontend:** React 19, Vite, TailwindCSS / Vanilla CSS (@media print)[cite: 4, 5].
* **Backend:** .NET 10 (C#), ASP.NET Core Web API.
* **Seguridad:** JSON Web Tokens (JWT Bearer, algoritmo HMAC-SHA256)[cite: 2].
* **ORM & Acceso a Datos:** Entity Framework Core 10 (SQL Server Provider, Migrations).
* **Base de Datos:** Microsoft SQL Server Express (`.\SQLEXPRESS`).

---

## 📁 Estructura del Repositorio

```text
ProyectoSimulador/
├── backend/
│   ├── AuthService/                      # Microservicio 1: Autenticación (Puerto 5001)
│   │   ├── Controllers/
│   │   │   └── AuthController.cs         # Emisión de tokens JWT
│   │   ├── Properties/
│   │   │   └── launchSettings.json       # Configuración de puerto 5001
│   │   ├── appsettings.json
│   │   ├── AuthService.csproj
│   │   └── Program.cs
│   │
│   └── SimuladorService/                 # Microservicio 2: Lógica Financiera (Puerto 5002)
│       ├── Controllers/
│       │   └── SimuladorController.cs    # Endpoints protegidos [Authorize]
│       ├── Data/
│       │   └── SimuladorDbContext.cs     # Mapeo de la tabla Simulaciones
│       ├── Models/
│       │   └── SimulacionRegistro.cs     # Entidad de persistencia histórica
│       ├── Services/
│       │   └── SimuladorService.cs       # Fórmulas Francés/Alemán y Seguro Desgravamen
│       ├── Properties/
│       │   └── launchSettings.json       # Configuración de puerto 5002
│       ├── appsettings.json
│       ├── SimuladorService.csproj
│       └── Program.cs
│
└── frontend/                             # Cliente Web SPA (Vite + React)
    ├── src/
    │   ├── App.jsx                       # Orquestación de interfaz, cálculo y tabla histórica
    │   ├── App.css
    │   └── main.jsx
    ├── package.json
    └── vite.config.js

⚙️ Requisitos PreviosAntes de ejecutar el proyecto, asegúrate de contar con el siguiente software instalado:.NET SDK 10 (o .NET SDK 8+)Node.js (versión 18 o superior)SQL Server Express (instancia por defecto: .\SQLEXPRESS o localhost\SQLEXPRESS)   SQL Server Management Studio (SSMS)

🚀 Instalación y Configuración Local
1. Clonar el Repositorio
Bash
git clone [https://github.com/SnaiderToainga/Proyecto_Simulador.git](https://github.com/SnaiderToainga/Proyecto_Simulador.git)
cd Proyecto_Simulador

2. Configurar Cadenas de ConexiónVerifica que la cadena de conexión en backend/SimuladorService/appsettings.json coincida con tu instancia local de SQL Server Express:   JSON{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=SimuladorDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}

3. Aplicar Migraciones en la Base de DatosPara generar la base de datos SimuladorDB y la tabla Simulaciones en tu motor local:   Bashcd backend/SimuladorService
dotnet ef database update
cd ../..
4. Instalar Dependencias del Frontend
Bash
cd frontend
npm install
cd ..

▶️ Ejecución del ProyectoPara correr la solución completa, abre 3 terminales independientes en la raíz del proyecto:   Terminal 1: Servicio de Autenticación (AuthService)Bashcd backend/AuthService
dotnet run
Puerto asignado: http://localhost:5001   Swagger / Endpoint: POST /api/auth/login   Terminal 2: Servicio de Simulación (SimuladorService)Bashcd backend/SimuladorService
dotnet run
Puerto asignado: http://localhost:5002   Endpoints:POST /api/simulador (Cálculo y persistencia)GET /api/simulador/historial (Consulta de cotizaciones previas)Terminal 3: Cliente Web (Frontend)Bashcd frontend
npm run dev
Acceso: http://localhost:5173 (o http://localhost:5174)   Credenciales de prueba:Usuario: adminContraseña: 12345🗄️ Verificación de la Base de Datos (SSMS)Para comprobar la persistencia física de datos tras realizar simulaciones en el frontend:   Abre SQL Server Management Studio (SSMS) y conéctate a .\SQLEXPRESS.   Abre una nueva consulta (New Query) y ejecuta[cite: 7]:SQLUSE SimuladorDB;
GO

SELECT 
    Id, 
    Fecha, 
    TipoCredito, 
    Monto, 
    PlazoMeses, 
    SistemaAmortizacion, 
    CuotaReferencial, 
    TotalPagar 
FROM dbo.Simulaciones 
ORDER BY Fecha DESC;
Podrás validar cómo cada cotización realizada desde la web se registra de manera inmutable. 

