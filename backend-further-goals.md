##  Validating Soldout and Blocking the "add to cart" button. 
### When Getting all products we must must validate them if "sizes === 0" so display the "soldOut" badge on them and they should not be able to added to Cart.

## Adding to cart Based on the sizes
### Now when user clicks on a product and open it in a new route and preview its images price and description etc, This is done from the "GET SINGLE PRODUCT" route, There should be sizes listed as well, so user can select at least one size and add to cart, that size can not be added to cart again and again with the same product but the same product can be added again with the different size.

## Adding an AddsOn array to a product
### While adding a product to the database, we wil add n a new property to the productSchema in the sizes array, which will be "addOnns", so Admin can add extra details which are offered with the product based on its sizes. So we will give Admin a Plus icon so he can add as many "addonns" as he want for a specific size, plus he can "update and delete" them as well, so we need include it in the POST route when we are adding a product + We need to track it in the PATCH route of the product Updation, and also create a delete Route for it seperately while targeting it with the _id of it, plus a last GET route to display it on the Frontend.

## Limiting the number of increment and decrement of products in Cart from the adminPanel 
### Also add another field in the productSchema which will be the "increment",Its type will be number, So this will be specified by the admin while adding a product to store, with the POST method, and the increment logic on frontend Local storage data will depend on this increment, if admin specify the increment:4 for a specific product so users will not be able to add more than 4 products.

## If the checkout is processed
#### If the checkout is processed for some products which user added to the cart so just minus that quantity for those sizes for that product size.

_________________________________________________________________________________________________________________________________________________________________________>

## 📝 Plan of Action (Chronological Order)

### 1. Schema Refactoring (Foundation): Update the ProductSchema to include the new fields: "sizes array elements must now include the addOns array. New top-level field:" increment (number).

## 2. CRUD Implementation (Adding & Updating): "Refactor the POST /api/products/add route to correctly handle the new sizes.addOns and the top-level increment field." "Refactor the PATCH /api/products/[id] route to handle updates/deletions of sizes and their nested addOns."

## 3. GET Logic & Validation (Product Listing): "Refactor the GET /api/products/get route to implement the "Sold Out" badge logic by checking if the total quantity across all sizes is zero. "Refactor the GET /api/products/[id] (Single Product) route to display the size and add-on information."

## 4. Dedicated AddOn Management: "Implement specific GET, POST, PATCH, and DELETE routes for AddOns (required for the Admin Panel interface to manage add-ons for a specific size/product)."

## 5. Cart Limit Logic: "Confirm how the frontend will use the new product.increment field to cap the quantity a user can add to the cart. (This is primarily a frontend logic check, but the backend must provide the data.)

## 6. Checkout Process (Inventory Reduction): "Implement the final logic in the Order Placement Route (which is downstream of /api/checkout/validate) to deduct stock (sizes.quantity) after a successful order."