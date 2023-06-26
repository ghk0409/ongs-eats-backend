# OngsEats

The Backend of OngsEats!!

옹스이츠 프로젝트

## 1. USER

### 1-1. User Entity:

-   id
-   createdAt
-   updatedAt

-   email
-   password
-   role (client | owner | delivery)

### 1-2. User Service:

-   Create Account
-   Log In
-   See Profile
-   Edit Profile
-   Verify Email

## 2. Restaurant

### 2-1. Restaurant Entity

-   name
-   category
-   address
-   coverImage

### 2-2. Restaurant Service:

-   Edit Restaurant
-   Delete Restaurant

-   See Categories
-   See Restaurants by Category (pagination)
-   See Restaurants (pagination)
-   See Restaurant

## 3. Dish

-   Create Dish
-   Edit Dish
-   Delete Dish

## 4. Order

-   Orders CRUD
-   Orders Subscription (Owner, Customer, Delivery)
    -   Pending Orders (Owner) (trigger: createOrder(newOrder)) (sub: newOrder)
    -   Order Status (Customer, Delivery, Owner) (trigger: editOrder(orderUpdate)) (sub: orderUpdate)
    -   Pending Pickup Order (Delivery) (trigger: editOrder(orderUpdate)) (sub: orderUpdate)

## 5. Payments (Cron)

-   payment (paddle 사용)
