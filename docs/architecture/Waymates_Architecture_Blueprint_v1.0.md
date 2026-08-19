# Waymates --- Architecture Blueprint

**Version:** 1.0\
**Status:** V1 / MVP Architecture Baseline\
**Product:** Waymates --- Collaborative Travel Planner

------------------------------------------------------------------------

#
---

# Visual Architecture Diagrams

The following diagrams are the quick-reference visual layer of the blueprint. The detailed sections below remain the implementation source of truth.

## 1. Platform Architecture

![Waymates Platform Architecture](./docs/diagrams/waymates-platform-architecture.png)

**Quick read:** Web and mobile clients communicate with the ASP.NET Core backend through REST and SignalR. The backend is organized as a modular monolith with clear Application, Domain, and Infrastructure boundaries, backed by PostgreSQL/EF Core and connected to external services such as Mapbox and email.

## 2. Data Model / ERD

![Waymates Data Model ERD](./docs/diagrams/waymates-data-model-erd.png)

**Quick read:** The ERD centers on Users, Trips, memberships, itinerary/planning entities, places, expenses/settlements, and location-sharing sessions. It shows the primary relationships and data ownership before implementation.

## 3. Planned Additional Visuals

The blueprint will also include visual diagrams for:

- User and process flows
- Deployment architecture
- Authentication and authorization flow
- Location-sharing architecture
- Expense and settlement flow

These diagrams will be added under `docs/diagrams/` as the corresponding designs are finalized.

# 1. Product Vision

Waymates is a collaborative travel planner for organizing trips,
building itineraries, saving places, sharing live locations, tracking
group expenses, splitting costs, and settling balances.

The product has two complementary experiences:

### Web --- Planning Workspace

Primarily used before and during the trip for:

-   Building itineraries
-   Managing different plans/groups
-   Searching and saving places
-   Managing expenses
-   Reviewing balances
-   Managing members
-   Viewing live locations

### Mobile --- Travel Companion

Primarily used during the trip for:

-   Today's itinerary
-   Maps and directions
-   Adding expenses quickly
-   Checking balances
-   Location sharing
-   Finding friends

Both clients use the same backend and database.

------------------------------------------------------------------------

## 2. Platform Architecture

``` text
                         WAYMATES
                            |
              +-------------+-------------+
              |                           |
       React Web App              React Native / Expo
              |                           |
              +-------------+-------------+
                            |
                     ASP.NET Core API
                            |
              +-------------+-------------+
              |             |             |
           REST API       SignalR       Auth
              |             |             |
              +-------------+-------------+
                            |
                         EF Core
                            |
                       PostgreSQL
                            |
          +-----------------+-----------------+
          |                 |                 |
       Mapbox          Email Provider      Storage
     Maps/Search/       Verification       Future
       Routing             Email
```

------------------------------------------------------------------------

## 3. Technology Stack

### Web

-   React
-   TypeScript
-   Vite
-   React Router
-   TanStack Query
-   Mapbox GL JS
-   Responsive CSS/design system

### Mobile

-   React Native
-   Expo
-   TypeScript

Native mobile capabilities will be used for:

-   GPS
-   Background location
-   Push notifications
-   Camera
-   Local storage
-   OS permissions

### Backend

-   ASP.NET Core Web API
-   ASP.NET Core Identity
-   JWT access tokens
-   Refresh tokens
-   SignalR
-   Entity Framework Core

### Database

-   PostgreSQL

### Infrastructure

-   Docker
-   GitHub Actions
-   Managed cloud hosting
-   Managed PostgreSQL

### External Services

-   Mapbox
-   Email provider
-   Future file/object storage
-   Optional error monitoring such as Sentry

------------------------------------------------------------------------

# 4. Backend Architecture --- Modular Monolith

Waymates will initially use a **modular monolith**, not microservices.

``` text
waymates/
|
+-- docs/
|   +-- diagrams/
|       +-- waymates-platform-architecture.png
|       +-- waymates-data-model-erd.png
|
+-- backend/
|   +-- Waymates.Api
+-- Waymates.Application
+-- Waymates.Domain
+-- Waymates.Infrastructure
|
+-- Tests
    +-- Waymates.UnitTests
    +-- Waymates.IntegrationTests
```

The application is one deployable backend, but its business capabilities
are separated into logical modules.

Example modules:

``` text
Trips
Members
Plans
Places
Expenses
Settlements
Locations
Authentication
```

The modules should have clear boundaries even though they run in the
same application.

------------------------------------------------------------------------

# 5. Why Modular Monolith Instead of Microservices?

Microservices are not inherently better. They solve a different class of
problems.

For Waymates, a modular monolith is the better starting point because:

### 5.1 The project is still small

Waymates is initially:

-   One product
-   One development team
-   One primary developer
-   One database
-   A relatively small number of domain areas

Running many independently deployed services would add infrastructure
without providing enough benefit.

### 5.2 Microservices introduce operational complexity

A microservice architecture might look like:

``` text
API Gateway
    |
    +-- Auth Service
    +-- Trip Service
    +-- Expense Service
    +-- Location Service
    +-- Notification Service
    +-- Place Service
         |
      Message Broker
         |
    Multiple Databases
```

Now we need to manage:

-   Service discovery
-   Network communication
-   Authentication between services
-   Distributed tracing
-   Message queues
-   Multiple deployments
-   Multiple databases
-   Failure between services
-   Versioning between services
-   Local development of many services
-   More CI/CD pipelines
-   More infrastructure costs

That is a lot of complexity for a portfolio MVP.

### 5.3 Waymates has strongly connected data

Consider:

``` text
Trip
 |
 +-- Members
 |
 +-- Plans
 |     |
 |     +-- Activities
 |
 +-- Expenses
 |     |
 |     +-- Participants
 |
 +-- Settlements
 |
 +-- Location Sessions
```

These concepts frequently need to interact within the same business
transaction.

For example:

> Add an expense → calculate participant shares → update balances.

Keeping that logic inside one application and database is
straightforward.

With microservices, we could introduce distributed transactions or
asynchronous events unnecessarily early.

### 5.4 Easier local development

With a modular monolith:

``` text
docker compose up
```

can start:

``` text
Waymates API
PostgreSQL
```

A microservice architecture could require:

``` text
Auth API
Trip API
Expense API
Location API
Notification API
PostgreSQL 1
PostgreSQL 2
Message broker
API Gateway
```

That makes learning the actual product much harder.

### 5.5 Easier deployment

One backend container:

``` text
waymates-api
```

is much easier to deploy than five or six independently deployed
services.

### 5.6 It doesn't prevent future extraction

This is the important part.

A modular monolith is not:

> "We can never use microservices."

Instead:

``` text
          MODULAR MONOLITH
                 |
       +---------+---------+
       |         |         |
     Trips    Expenses   Locations
       |         |         |
       +---------+---------+
                 |
          Clear boundaries
```

If the product eventually grows enough to justify separation:

``` text
Trips Module       -> Trip Service
Expenses Module    -> Expense Service
Locations Module   -> Location Service
```

we can extract modules later.

The architectural goal is therefore:

> **Design clear module boundaries now, deploy them together initially,
> and extract only when there is a real reason.**

------------------------------------------------------------------------

# 6. Final ERD --- Conceptual Model

``` text
+--------------+
|    Users     |
+------+-------+
       |
       | 1
       | *
+------v-------------+
|    TripMembers     |
+------+-------------+
       |
       | *
       | 1
+------v------+
|    Trips    |
+------+------+
       |
       +------------------------+
       |                        |
       | *                      | *
+------v------+          +------v-------+
|    Plans    |          |    Places    |
+------+------+          +------+-------+
       |                        |
       | *                      | *
+------v-----------+     +------v---------+
|  PlanMembers     |     | ActivityPlaces |
+------------------+     +----------------+
       |
       | *
+------v-----------+
|    Activities   |
+-----------------+

Trips
 |
 | *
+v------------------+
|     Expenses      |
+---------+---------+
          |
          | *
+---------v----------------+
|   ExpenseParticipants   |
+-------------------------+

Trips
 |
 | *
+v------------------+
|    Settlements    |
+-------------------+

Trips
 |
 | *
+v---------------------------+
| LocationSharingSessions    |
+-------------+-------------+
              |
              | *
       +------v-------------+
       |   LocationUpdates  |
       +--------------------+
```

------------------------------------------------------------------------

# 7. Core Entities

## Users

Managed primarily through ASP.NET Identity.

Additional profile fields:

``` text
Id
Email
UserName
FirstName
LastName
ProfileImageUrl
CreatedAt
UpdatedAt
```

------------------------------------------------------------------------

## Trips

``` text
Id
Name
Description
StartDate
EndDate
TimeZone
SettlementCurrency
CoverImageUrl
CreatedByUserId
Status
CreatedAt
UpdatedAt
ArchivedAt
```

`SettlementCurrency` is nullable.

Examples:

``` text
PHP
VND
USD
JPY
```

If the group has not decided yet:

``` text
NULL
```

------------------------------------------------------------------------

## TripMembers

``` text
TripId
UserId
Role
Status
JoinedAt
RemovedAt
```

Roles:

-   Owner
-   Admin
-   Member

Status:

-   Active
-   Removed

Historical membership records are retained.

------------------------------------------------------------------------

## Plans

Supports multiple plans/groups on the same date.

``` text
Id
TripId
Name
Description
Date
CreatedByUserId
CreatedAt
UpdatedAt
```

Example:

``` text
Nov 17

Everyone
Roj + Anna
Mark + John
```

------------------------------------------------------------------------

## PlanMembers

``` text
PlanId
UserId
```

A trip member can participate in one plan without participating in
another.

------------------------------------------------------------------------

## Activities

``` text
Id
PlanId
Title
Description
StartDateTime
EndDateTime
IsAllDay
ActivityType
PlaceId
EstimatedAmount
EstimatedCurrency
SortOrder
CreatedByUserId
CreatedAt
UpdatedAt
```

------------------------------------------------------------------------

## ActivityParticipants

``` text
ActivityId
UserId
```

Allows a plan to contain activities that only some plan members attend.

------------------------------------------------------------------------

## Places

Waymates owns the place record while Mapbox provides external map/search
services.

``` text
Id
TripId
Name
Address
Latitude
Longitude
MapboxPlaceId
Category
CreatedByUserId
CreatedAt
UpdatedAt
```

------------------------------------------------------------------------

## Expenses

``` text
Id
TripId
Description
Category

OriginalAmount
OriginalCurrency

SettlementAmount
SettlementCurrency

ExchangeRate
ExchangeRateDate
ExchangeRateSource

PaidByUserId
ExpenseDate
Notes
CreatedByUserId
CreatedAt
UpdatedAt
DeletedAt
```

Original currency is what was actually charged.

Settlement currency is the currency used to express the trip balance.

------------------------------------------------------------------------

## ExpenseParticipants

``` text
ExpenseId
UserId
SplitType
Amount
Percentage
Shares
```

Supported split modes:

-   Equal
-   Custom
-   Percentage

V1 can prioritize Equal and Custom.

------------------------------------------------------------------------

## Settlements

A settlement is separate from an expense.

``` text
Id
TripId
FromUserId
ToUserId

DebtAmount
DebtCurrency

PaidAmount
PaidCurrency

ExchangeRate
ExchangeRateDate
ExchangeRateSource

PaymentMethod
Status
Note
CreatedAt
SettledAt
```

Example:

``` text
Debt:
PHP 2,832

Actual payment:
VND 1,200,000
```

The original expense is never overwritten.

------------------------------------------------------------------------

## LocationSharingSessions

Location sharing is session-based and does not automatically expire at
midnight.

``` text
Id
TripId
UserId

StartedAt
EndedAt
Status

LastLatitude
LastLongitude
LastAccuracy
LastUpdatedAt
```

A session ends when the user explicitly stops sharing or the system
invalidates it.

------------------------------------------------------------------------

## LocationUpdates

Potentially high-volume data:

``` text
Id
SessionId
Latitude
Longitude
Accuracy
RecordedAt
```

V1 should minimize historical retention. Live location is the primary
requirement.

------------------------------------------------------------------------

# 8. Authentication Architecture

ASP.NET Identity + JWT.

``` text
Login
  |
  v
ASP.NET Identity
  |
  +-- Access Token
  |
  +-- Refresh Token
  |
  v
React / Mobile
```

Authentication features:

-   Registration
-   Email verification
-   Login
-   Logout
-   Refresh token
-   Forgot password
-   Reset password
-   Change password

------------------------------------------------------------------------

# 9. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> Are you allowed to do this?

Every protected trip operation verifies trip membership/role on the
backend.

Example:

``` text
GET /api/trips/{tripId}

Authenticated?
     |
     v
Trip member?
     |
     v
Allowed
```

Location access additionally verifies:

``` text
Same trip?
     |
     v
Target user sharing?
     |
     v
Show location
```

The frontend must never be the final authorization layer.

------------------------------------------------------------------------

# 10. Maps & Routing

Mapbox provides:

-   Map rendering
-   Place search
-   Geocoding
-   Reverse geocoding
-   Routing

Waymates stores its own place records.

``` text
Waymates Place
     |
     +-- Latitude
     +-- Longitude
     +-- Address
     +-- MapboxPlaceId
```

Routing:

``` text
Waymates
   |
   v
Mapbox Directions
   |
   v
Route displayed in Waymates
```

External navigation:

-   Open in Google Maps
-   Open in Apple Maps

Waymates owns the travel context; external map apps can handle
turn-by-turn navigation.

------------------------------------------------------------------------

# 11. Realtime Architecture

SignalR will handle:

### Location

``` text
Mobile
  |
  v
SignalR Hub
  |
  +-- Roj
  +-- Anna
  +-- Mark
```

### Other realtime events

-   ExpenseAdded
-   ExpenseUpdated
-   ActivityAdded
-   ActivityUpdated
-   MemberJoined
-   MemberRemoved
-   LocationStarted
-   LocationStopped

Example:

``` text
Anna adds expense
      |
      v
ASP.NET API
      |
      v
PostgreSQL
      |
      v
SignalR
      |
      v
Roj's browser
      |
      v
Expense list updates
```

------------------------------------------------------------------------

# 12. Responsive Web

The web application supports:

### Desktop

`>= 1200px`

Primary planning workspace.

### Tablet / small laptop

`768–1199px`

Collapsible navigation and reduced multi-column layouts.

### Mobile browser

`< 768px`

Quick-access experience using cards, bottom sheets, and simplified
navigation.

The web app should not simply shrink desktop components onto a phone.

------------------------------------------------------------------------

# 13. Native Mobile

React Native + Expo will provide the dedicated travel experience.

Native capabilities:

-   GPS
-   Background location
-   Push notifications
-   Camera
-   Local storage
-   OS permissions

The mobile client consumes the same backend API and SignalR
infrastructure.

------------------------------------------------------------------------

# 14. Offline Strategy

V1 supports basic read-only offline access.

Cached data:

-   Trip details
-   Itinerary
-   Saved places
-   Expense history
-   Balances
-   Members

Offline state:

``` text
You're offline.

Showing your last synced trip data.
```

Full offline mutation/synchronization is Phase 2.

------------------------------------------------------------------------

# 15. CI/CD

GitHub is the center of the development workflow.

``` text
Feature Branch
      |
      v
Pull Request
      |
      v
GitHub Actions
      |
      +-- Backend build
      +-- Backend tests
      +-- Frontend build
      +-- Frontend tests
      +-- Lint
      +-- Security checks
      |
      v
Merge to main
      |
      v
Build Docker Image
      |
      v
Container Registry
      |
      v
Deploy
```

------------------------------------------------------------------------

# 16. Deployment

Initial deployment model:

``` text
                 GitHub
                    |
               GitHub Actions
                    |
          +---------+---------+
          |                   |
          v                   v
       Frontend             Backend
       Vercel              Render/Railway
                              |
                              v
                         PostgreSQL
```

Docker packages the ASP.NET Core backend.

Azure can be explored later as an additional cloud deployment exercise.

------------------------------------------------------------------------

# 17. Environments

``` text
Development
     |
     v
Staging
     |
     v
Production
```

Development runs locally.

Staging validates deployed builds.

Production hosts the actual application.

------------------------------------------------------------------------

# 18. Secrets

Never commit:

``` text
JWT_SECRET
DATABASE_PASSWORD
MAPBOX_TOKEN
EMAIL_API_KEY
```

Use local environment files for development and platform/GitHub secrets
for deployed environments.

------------------------------------------------------------------------

# 19. Testing

### Unit tests

Focus on business logic:

-   Expense splitting
-   Currency conversion
-   Balance calculation
-   Settlement optimization
-   Trip authorization
-   Membership rules

### Integration tests

-   Create trip
-   Add member
-   Create expense
-   Calculate balance
-   Record settlement

### Frontend tests

Important flows:

-   Login
-   Create trip
-   Add activity
-   Add expense
-   View balance

------------------------------------------------------------------------

# 20. Health & Monitoring

Endpoints:

``` text
/api/health
/api/health/ready
```

Health checks cover:

-   API
-   Database
-   Required dependencies

Production should have:

-   Structured logging
-   Error tracking
-   Dependency monitoring
-   Database backups

Sentry is an optional error-monitoring service.

------------------------------------------------------------------------

# 21. Security Principles

Waymates handles sensitive travel and location information.

Rules:

-   Never expose passwords or secrets
-   Never expose access/refresh tokens in logs
-   Location is visible only to appropriate trip members while sharing
    is active
-   Minimize location-history retention
-   Enforce authorization in the API
-   Validate all inputs
-   Use EF Core/parameterized queries
-   Protect secrets through environment/platform secret storage

------------------------------------------------------------------------

# 22. MVP Scope

``` text
AUTH
  Registration/Login
  Password recovery

TRIPS
  Create
  Join
  Members
  Roles
  Ownership
  Settings

PLANS
  Daily plans
  Multiple groups
  Activities

MAP
  Search
  Pins
  Saved places
  Directions

EXPENSES
  Multiple currencies
  Splitting
  Balances
  Settlements

REALTIME
  SignalR
  Location sharing

OFFLINE
  Basic read-only cache

DEVOPS
  GitHub Actions
  Docker
  CI
  CD
```

------------------------------------------------------------------------

# 23. Phase 2 Backlog

Intentionally deferred:

-   Push notifications
-   Receipt uploads
-   Calendar integration
-   Advanced offline synchronization
-   Trip budgets
-   Travel documents
-   Advanced location history
-   Geofencing
-   Chat
-   AI trip planning
-   Advanced analytics

------------------------------------------------------------------------

# 24. Development Roadmap

### Phase 1 --- Foundation

-   Repository
-   React
-   ASP.NET Core
-   PostgreSQL
-   EF Core
-   Docker
-   GitHub Actions
-   Initial deployment

### Phase 2 --- Authentication

-   ASP.NET Identity
-   JWT
-   Refresh tokens
-   Email verification
-   Password reset

### Phase 3 --- Trips & Members

-   Create trip
-   Join trip
-   Members
-   Roles
-   Ownership
-   Settings

### Phase 4 --- Itinerary

-   Plans
-   Plan members
-   Activities
-   Places

### Phase 5 --- Maps

-   Mapbox
-   Search
-   Pins
-   Saved places
-   Routes
-   Directions

### Phase 6 --- Expenses

-   Expenses
-   Currencies
-   Splitting
-   Balances
-   Settlement suggestions

### Phase 7 --- Settlements

-   Record settlement
-   Different settlement currency
-   Exchange rates
-   Settlement history

### Phase 8 --- Realtime

-   SignalR
-   Realtime trip updates
-   Location sessions
-   Live locations

### Phase 9 --- Offline

-   Caching
-   Offline state
-   Last-synced data

### Phase 10 --- Production Polish

-   Testing
-   Security
-   Monitoring
-   Performance
-   CI/CD
-   Production deployment

------------------------------------------------------------------------

# 25. Final Architecture

``` text
                              USERS
                       +--------+--------+
                       |                 |
                  Desktop/Web       iOS Mobile
                       |                 |
                       +--------+--------+
                                |
                         React / React Native
                                |
                         +------+------+
                         |             |
                       REST         SignalR
                         |             |
                         +------+------+
                                |
                       ASP.NET Core API
                                |
            +-------------------+-------------------+
            |                   |                   |
       Application           Domain           Infrastructure
            |                   |                   |
            +-------------------+-------------------+
                                |
                             EF Core
                                |
                           PostgreSQL
                                |
          +---------------------+---------------------+
          |                     |                     |
       Mapbox               Email              File Storage
      Maps/Search          Verification          Future
       Routing
```

------------------------------------------------------------------------

# 26. Architecture Principle

The guiding principle for Waymates is:

> **Start simple, keep boundaries clear, and add complexity only when
> the product actually needs it.**

The application should be production-minded without prematurely adopting
infrastructure that doesn't solve a current problem.

That means:

-   Modular monolith before microservices
-   Managed PostgreSQL before database infrastructure
-   Docker before Kubernetes
-   GitHub Actions before complex CI platforms
-   SignalR before a separate realtime service
-   Basic caching before full offline synchronization
-   Mapbox abstraction before vendor lock-in
-   Clear domain boundaries before distributed services

This keeps Waymates teachable, deployable, and maintainable while
leaving room to evolve.
