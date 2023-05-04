let sort = 'asc';
let limit = '0';
let categoryActive = '';
let productModal = null;

let controller = null;
let signal = null;

document.addEventListener('DOMContentLoaded', function () {
    productModal = new bootstrap.Modal(document.getElementById('productModal'));

    loadAllProducts();

    fetch('https://fakestoreapi.com/products/categories', {
        signal: signal
    })
        .then(res => res.json())
        .then(json => {
            let categoriesScroll = document.getElementById('categories-scroll');
            json.forEach(category => {
                let categoryElem = document.createElement('a');
                categoryElem.classList.add('col-xl-2', 'col-sm-5', 'nav-link', 'text-white', 'bg-dark', 'rounded-pill', 'mx-3', 'p-2', 'text-center');
                categoryElem.href = '#';
                categoryElem.innerText = category.charAt(0).toUpperCase() + category.slice(1);
                categoryElem.addEventListener('click', function () {
                    removeCurrentCategory();
                    categoryActive = category;

                    if (controller) {
                        controller.abort();
                    }

                    let loaders = document.getElementsByClassName('loader');
                    this.classList.toggle('active');
                    for (let loader of loaders) {
                        loader.style.display = 'block';
                    }
                    document.getElementById('products').innerHTML = '';
                    loadAllProducts();
                });
                categoriesScroll.appendChild(categoryElem);
            });
        });

    document.getElementById('btnHome').addEventListener('click', function () {
        removeCurrentCategory();
        loadAllProducts();
    });

    document.querySelectorAll('.dropdownSort ul li a').forEach(item => {
        item.addEventListener('click', function () {
            sort = this.getAttribute('data-value');
            loadAllProducts();
        });
    });

    document.querySelectorAll('.dropdownLimit ul li a').forEach(item => {
        item.addEventListener('click', function () {
            limit = this.getAttribute('data-value');
            loadAllProducts();
        });
    });

    document.getElementById('productDeleteBtn').addEventListener('click', function () {
        let productId = this.getAttribute('data-product-id');
        Swal.fire({
            title: 'Are you sure you want to delete this product?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            let productLoader = document.getElementById('productLoader');
            productLoader.style.display = 'block';
            document.body.style.opacity = '0.5';
            if (result.isConfirmed) {
                fetch(`https://fakestoreapi.com/products/${productId}`, {
                    method: 'DELETE',
                    signal: signal
                })
                    .then(res => res.json())
                    .then(json => {
                        productModal.hide();
                        showToast('Success', `Product with ID ${json.id} has been deleted successfully.`, 'success');
                        productLoader.style.display = 'none';
                        document.body.style.opacity = '1';
                    })
                    .catch(err => {
                        showToast('Error', 'An error occurred while deleting the product.', 'error')
                    });
            }
        });
    });
});

function removeCurrentCategory() {
    let categoryActiveElem = document.querySelector('#categories-scroll .active');
    if (categoryActiveElem !== null) {
        categoryActive = '';
        categoryActiveElem.classList.remove('active');
    }
}

function showToast(title, text, icon) {
    Swal.fire({
        title: title,
        text: text,
        icon: icon,
        toast: true,
        position: 'bottom',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

function loadAllProducts() {
    controller = null;
    signal = null;

    let link = `https://fakestoreapi.com/products?sort=${sort}&limit=${limit}`;

    if (categoryActive !== '') {
        link = `https://fakestoreapi.com/products/category/${categoryActive}?sort=${sort}&limit=${limit}`;
    }

    controller = new AbortController();
    signal = controller.signal;

    document.getElementById('products').innerHTML = '';
    document.getElementById('productLoader').style.display = 'block';
    fetch(link, {
        signal: signal
    })
        .then(res => res.json())
        .then(json =>
            json.forEach(product => {
                createCard(product);
            })
        )
        .then(() => {
            hideLoaders();
        })
        .catch(err => {
            console.log(err);
        });
}

function createCard(product) {
    let col = document.createElement('div');
    col.classList.add('col-lg-2', 'col-md-3', 'col-sm-4', 'd-flex', 'justify-content-center', 'p-0', 'm-4');
    col.setAttribute('product-id', product.id);
    col.addEventListener('click', function () {
        productModal.show();
        let modalBody = document.querySelector('#productModal .modal-body');
        console.log(modalBody);
        let modalBodyHtml = `
            <div class="row">
                <div class="col-lg-6 col-sm-12 my-sm-5 d-flex align-items-center">
                    <img src="${product.image}" alt="${product.title}" class="img-fluid rounded">
                </div>
                <div class="col-lg-6 col-sm-12">
                    <h3>${product.title}</h3>
                    <p>${product.description}</p>
                    <p class="price">${product.price}€</p> 
                </div>
            </div>
        `;
        modalBody.innerHTML = modalBodyHtml;
        document.getElementById('productDeleteBtn').setAttribute('data-product-id', product.id);
        document.getElementById('productEditBtn').setAttribute('data-product-id', product.id);
    });

    let card = document.createElement('div');
    card.classList.add('card');

    let loader = createLoader();

    let {textBox, head, span, price} = createTextBox(product);

    let img = document.createElement('img');
    img.classList.add('img', 'rounded', 'py-3');
    img.src = product.image;
    img.alt = product.title;

    img.onload = function () {
        loader.style.display = 'none';
        card.appendChild(img);
    }

    textBox.appendChild(head);
    textBox.appendChild(span);
    textBox.appendChild(price);
    card.appendChild(loader);
    card.appendChild(textBox);
    col.appendChild(card);

    document.getElementById('products').appendChild(col);
}

function createLoader() {
    let loader = document.createElement('div');
    loader.classList.add('loader');
    for (let i = 0; i < 9; i++) {
        let square = document.createElement('div');
        square.classList.add('square');
        square.id = 'sq' + (i + 1);
        loader.appendChild(square);
    }
    return loader;
}

function hideLoaders() {
    let loader = document.getElementById('productLoader');
    loader.style.display = 'none';
}

function createTextBox(product) {
    let textBox = document.createElement('div');
    textBox.classList.add('textBox');

    let head = document.createElement('p');
    head.classList.add('text', 'head', 'p-2', 'text-center');
    head.innerText = product.title;

    let span = document.createElement('span');
    span.innerText = product.category.charAt(0).toUpperCase() + product.category.slice(1);
    let price = document.createElement('p');

    price.classList.add('text', 'price');
    price.innerText = product.price + '€';
    return {textBox, head, span, price};
}