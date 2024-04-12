// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;



interface IERC20Token {
    function transfer(address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
    function totalSupply() external view returns (uint256);
    function balanceOf(address) external view returns (uint256);
    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Marketplace {
    uint internal productsLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

     // Represents a product in the marketplace.
    struct Product {
        address payable owner;
        string name;
        string image;
        string description;
        string location;
        uint price;
        uint sold;
        uint reviewCount; // Track the number of reviews per product
        uint upvotes; // Track the number of upvotes per product
    }

    // Represents a review for a product.
    struct Review {
        address reviewer; // The address of the user who wrote the review.
        string comment; // The content of the review.
        uint rating; // A numerical rating for the product, on a scale of 1 to 5.
    }

    // Mapping from product ID to the Product struct, storing all products listed in the marketplace.
    mapping (uint => Product) internal products;
    // Mapping from product ID to an array of Review structs, storing all reviews for each product.
    mapping (uint => Review[]) public reviews;
    // Mapping to track which users (addresses) have purchased a particular product. This is used to enforce rules around who can leave a review.
    mapping (uint => mapping(address => bool)) public hasBought;
    // Mapping to track which users (addresses) have upvoted a particular product, preventing multiple upvotes from the same user.
    mapping (uint => mapping(address => bool)) public hasUpvoted;

    // Event emitted when a product is successfully purchased.
    event ProductPurchased(uint indexed productId, address buyer);
    // Event emitted when a review is added to a product.
    event ReviewAdded(uint indexed productId, address reviewer);
    // Event emitted when a product is upvoted.
    event ProductUpvoted(uint indexed productId, address voter);

    // Functions
    function writeProduct(string memory _name, string memory _image, string memory _description, string memory _location, uint _price) public {
        products[productsLength] = Product(
            payable(msg.sender),
            _name,
            _image,
            _description,
            _location,
            _price,
            0, // Initially sold 0
            0,  // Initially 0 reviews
            0   // Initially 0 upvotes
        );
        productsLength++;
    }

    function readProduct(uint _index) public view returns (address payable, string memory, string memory, string memory, string memory, uint, uint, uint) {
        Product memory product = products[_index];
        return (product.owner, product.name, product.image, product.description, product.location, product.price, product.sold, product.upvotes);
    }

    // Facilitates the purchase of a product, transferring the specified amount of cUSD from the buyer to the product owner.
    function buyProduct(uint _index) public payable {
        require(IERC20Token(cUsdTokenAddress).transferFrom(msg.sender, products[_index].owner, products[_index].price), "Transfer failed.");
        products[_index].sold++;
        hasBought[_index][msg.sender] = true; // Mark the buyer as having bought the product
        emit ProductPurchased(_index, msg.sender);
    }

    // add a review, ensuring that only buyers can review and that the rating is within the 1-5 range.
    function addReview(uint _productId, string memory _comment, uint _rating) public {
        require(hasBought[_productId][msg.sender], "You must purchase the product before reviewing.");
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5.");
        reviews[_productId].push(Review(msg.sender, _comment, _rating));
        products[_productId].reviewCount++;
        emit ReviewAdded(_productId, msg.sender);
    }

    // Enables a user to upvote a product, provided they haven't already done so.
    function upvoteProduct(uint _productId) public {
        require(!hasUpvoted[_productId][msg.sender], "You have already upvoted this product.");
        products[_productId].upvotes++;
        hasUpvoted[_productId][msg.sender] = true; // Mark the user as having upvoted the product
        emit ProductUpvoted(_productId, msg.sender);
    }

    // Allows a product owner to update the details of their product.
    // Only the owner of the product can update its details.
    function updateProduct(
        uint _productId,
        string memory _name,
        string memory _image,
        string memory _description,
        string memory _location,
        uint _price
    ) public {
        // Ensure the product exists by checking if the owner address is not the zero address.
        require(_productId < productsLength, "Product does not exist.");

        // Fetch the product from storage.
        Product storage product = products[_productId];

        // Ensure that the caller is the owner of the product.
        require(msg.sender == product.owner, "Only the product owner can update the product.");

        // Update the product details.
        product.name = _name;
        product.image = _image;
        product.description = _description;
        product.location = _location;
        product.price = _price;

        // Note: `sold`, `reviewCount`, and `upvotes` are not updated as they represent accumulative actions on the product.
    }


    // Retrieves and returns all reviews for a given product.
    function getReviewsForProduct(uint _productId) public view returns (Review[] memory) {
        return reviews[_productId];
    }


    // Returns the total number of products listed in the marketplace.
    function getProductsLength() public view returns (uint) {
        return productsLength;
    }
}
