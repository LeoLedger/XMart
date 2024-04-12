# XMart
﻿
## Description
This is a gadgets marketplace dapp where users can:
* View gadgets on the store
* Add gadgets to the store
* Buy gadgets
* Drop a review on gadgets bought
* See what others think about the gadgets
## Mappings
﻿
- `products`: Maps a product ID (uint) to a Product struct, storing details about each product listed on the marketplace.
- `reviews`: Maps a product ID to an array of Review structs, holding all reviews associated with a specific product.
- `hasBought`: A double mapping that tracks whether a specific address (user) has purchased a particular product. This is used to enforce rules around who can leave a review.
- `hasUpvoted`: Similar to hasBought, this double mapping tracks whether an address (user) has upvoted a specific product, preventing multiple upvotes from the same user.
  ﻿
## Events
﻿
- `ProductPurchased`: Emitted when a product is purchased, including the product ID and buyer's address.
- `ReviewAdded`: Emitted upon the addition of a review, indicating the product ID and the reviewer's address.
- `ProductUpvoted`: Signifies that a product has been upvoted, detailing the product ID and the voter's address.
  ﻿
## Functions
﻿
- `writeProduct` - Allows users to list a new product on the marketplace by providing details such as name, image, description, location, and price.
  ﻿
- `readProduct` - Returns the details of a product by its ID, including owner address, name, image, description, location, price, the number of times sold, and upvotes.
  ﻿
- `buyProduct` - Enables the purchase of a product using cUSD tokens. It checks for successful transfer of funds from the buyer to the product owner, increments the sold counter, and marks the buyer as having purchased the product.
  ﻿
- `addReview` - Allows users who have purchased a product to add a review. It requires the user to have bought the product and restricts the rating to a scale of 1 to 5.
  ﻿
- `upvoteProduct` - Users can upvote a product, given they haven't already done so. It increments the product's upvote count and marks the user as having upvoted.
  ﻿
- `getReviewsForProduct` - Returns all reviews for a given product, facilitating transparency and informed purchasing decisions.  
  ﻿
- `getProductsLength` - Provides the total number of products listed on the marketplace, useful for iterating over all products.
  ﻿
  ﻿