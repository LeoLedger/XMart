import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import marketplaceAbi from "../contract/Market.abi.json"
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const MPContractAddress = "0xf82C9E470166DF6D727016DBd948364D26784583"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let kit
let contract
let gadgets = []

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(MPContractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}

const getProducts = async function () {
  const _productLength = await contract.methods.getProductsLength().call()
  const _gadgets = []
  for (let i = 0; i < _productLength; i++) {
    let _gadget = new Promise(async (resolve, reject) => {
      let product = await contract.methods.readProduct(i).call()
      let reviews = await contract.methods.getReviewsForProduct(i).call()
      console.log(reviews)
      console.log(product)
      resolve({
        index: i,
        owner: product[0],
        name: product[1],
        image: product[2],
        description: product[3],
        location: product[4],
        price: new BigNumber(product[5]),
        sold: product[6],
        upvotes: product[7],
        reviews: reviews
      })
    })
    _gadgets.push(_gadget)
  }
  gadgets = await Promise.all(_gadgets)

  renderProducts()
}

const renderProducts = async () => {
  document.getElementById("marketplace").innerHTML = "";
  gadgets.forEach(_gadget => {
    const newDiv = document.createElement("div");
    newDiv.className = "col-md-4";
    newDiv.innerHTML = productTemplate(_gadget);
    document.getElementById("marketplace").appendChild(newDiv);
  });
};

const renderReviews = async (index) => {
  const reviewsContainer = document.getElementById("reviews");
  reviewsContainer.innerHTML = ""; // Clear existing reviews
  
  const reviews = gadgets[index].reviews;
  
  // Check if there are no reviews for the product
  if (reviews.length === 0) {
    const noReviewsDiv = document.createElement("div");
    noReviewsDiv.innerHTML = "No Reviews added yet";
    noReviewsDiv.className = "no-reviews"; // Optional: add a class for styling
    reviewsContainer.appendChild(noReviewsDiv);
  } else {
    // If there are reviews, render them
    reviews.forEach(_review => {
      const newDiv = document.createElement("div");
      const reviewText = document.createElement("div");
      const reviewRating = document.createElement("div");
      const imgDiv = document.createElement('div');
      imgDiv.innerHTML = identiconTemplate(_review[0]);
      reviewText.className = "col-md-8";
      reviewRating.className = "col-md-2";
      imgDiv.className = "col-md-2";
      reviewText.innerHTML = `${_review[1]}`; // Review text
      reviewRating.innerHTML = `Rating: ${_review[2]}`; // Review rating
      
      const reviewTemp = document.createElement("div");
      reviewTemp.style.padding = "15px";
      reviewTemp.className = "row";
      reviewTemp.appendChild(imgDiv);
      reviewTemp.appendChild(reviewText);
      reviewTemp.appendChild(reviewRating);
      reviewsContainer.appendChild(reviewTemp);
    });
  }
  
  document.getElementById("addReviewBtn").dataset.id = index; // Set product ID for add review button
};


function productTemplate(_gadget) {
  return `
    <div class="card mb-4">
      <img class="card-img-top" src=${_gadget.image} alt="${_gadget.name}...">
      <div class="position-absolute top-0 begin-0 bg-warning mt-4 me-2 px-2 py-1 rounded">
        ${_gadget.upvotes} Upvotes
      </div>
      <div class="position-absolute top-0 end-0 bg-warning mt-4 me-2 px-2 py-1 rounded">
        ${_gadget.sold} Sold
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_gadget.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_gadget.name}</h2>
        <p class="card-text mb-4" style="min-height: 20px; font-weight: 500;">
        ${_gadget.description}             
        </p>
        <p class="card-text mb-4" style="min-height: 20px; font-weight: 500;">
        Location: ${_gadget.location}             
        </p>

        <div class="d-grid gap-2">
          <a
          class="btn btn-dark rounded-pill reviewsBtn"
          data-bs-toggle="modal"
          data-bs-target="#reviewsModal"
          id=${_gadget.index}
        >
          Reviews
        </a>
        <a class="btn btn-lg btn-outline-dark like fs-6 p-3" id=${_gadget.index}>
            Upvote
          </a>
          <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id=${_gadget.index}>
            Buy for ${_gadget.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
          </a>
        </div>
      </div>
    </div>
  `
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await getProducts()
  notificationOff()
});


document
  .querySelector("#newProductBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newDescription").value,
      document.getElementById("newLocation").value,
      new BigNumber(document.getElementById("newPrice").value)
        .shiftedBy(ERC20_DECIMALS)
        .toString()
    ]
    notification(`⌛ Adding "${params[0]}"...`)
    try {
      const result = await contract.methods
        .writeProduct(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getProducts()
  })

document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("buyBtn")) {
    const index = e.target.id
    notification("⌛ Waiting for payment approval...")
    try {
      await approve(gadgets[index].price)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`⌛ Awaiting payment for "${gadgets[index].name}"...`)
    try {
      const result = await contract.methods
        .buyProduct(index)
        .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully bought "${gadgets[index].name}".`)
      getProducts()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
})

document.querySelector('#marketplace').addEventListener('click', async (e) => {
  if (e.target.className.includes("like")) {
    const index = e.target.id;
    console.log(index);
    console.log(gadgets[index]);

    notification(`⌛ Checking if you've already upvoted ${gadgets[index].name}...`);
    
    try {
      // Check if the user has already upvoted the product
      const hasAlreadyUpvoted = await contract.methods.hasUpvoted(index, kit.defaultAccount).call();
      
      if (hasAlreadyUpvoted) {
        notification(`⚠️ You've already upvoted "${gadgets[index].name}". No need to upvote again.`);
        return; // Exit the function early if the user has already upvoted
      }

      // Proceed to upvote since the user hasn't upvoted yet
      notification(`⌛ Upvoting ${gadgets[index].name}...`);
      const result = await contract.methods.upvoteProduct(index).send({ from: kit.defaultAccount });
      notification(`🎉 You upvoted "${gadgets[index].name}".`);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
    
    getProducts();
  }
});


document.querySelector('#marketplace').addEventListener('click', async (e) => {
  if (e.target.className.includes("reviewsBtn")) {
    const index = e.target.id;
    renderReviews(index);
  }
});

document.querySelector("#addReviewBtn").addEventListener("click", async (e) => {
  const reviewText = document.getElementById("reviewInput").value;
  const rating = parseInt(document.getElementById("ratingInput").value, 10); // Assuming you have a <select> input for ratings with id="ratingInput"
  const productId = e.target.dataset.id; // Ensure this is correctly retrieving the product ID
  
  notification(`⌛ Checking purchase status for ${gadgets[productId].name}...`);
  try {
    const hasBoughtProduct = await contract.methods.hasBought(productId, kit.defaultAccount).call();
    
    if (!hasBoughtProduct) {
      notification(`⚠️ You must purchase ${gadgets[productId].name} before adding a review.`);
      return; // Exit the function if the user hasn't bought the product
    }

    // If the user has bought the product, proceed to add the review
    notification(`⌛ Adding Review for ${gadgets[productId].name}...`);
    const result = await contract.methods.addReview(productId, reviewText, rating).send({ from: kit.defaultAccount });
    notification(`🎉 You successfully added a review for "${gadgets[productId].name}".`);
    getProducts(); // Refresh the products list to show the new review
  } catch (error) {
    console.error(error); // Log the error to the console for debugging
    notification(`⚠️ Unable to add review, an error occurred: ${error.message}`);
  }
});

