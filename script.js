document.addEventListener('DOMContentLoaded', () => {
    const productContainer = document.getElementById('product-container');
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const paymentForm = document.getElementById('payment-form');
    const expirationDateInput = document.getElementById('expiration-date');
    const cvvInput = document.getElementById('cvv');
    let cart = [];

    // Cargar productos desde la API
    fetch('https://fakestoreapi.com/products')
        .then(response => response.json())
        .then(products => {
            products.forEach(product => {
                const card = document.createElement('div');
                card.classList.add('col-md-4');
                card.innerHTML = `
                    <div class="card">
                        <img src="${product.image}" class="card-img-top" alt="${product.title}">
                        <div class="card-body">
                            <h5 class="card-title">${product.title}</h5>
                            <p class="card-text">$${product.price}</p>
                            <button class="btn btn-primary add-to-cart" data-id="${product.id}">Añadir al carrito</button>
                        </div>
                    </div>
                `;
                productContainer.appendChild(card);
            });

            // Añadir evento a los botones de "Añadir al carrito"
            const addToCartButtons = document.querySelectorAll('.add-to-cart');
            addToCartButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = event.target.dataset.id;
                    const product = products.find(p => p.id === parseInt(productId));
                    $('#quantityModal').modal('show');
                    $('#add-to-cart-btn').off('click').on('click', () => {
                        const quantity = parseInt(document.getElementById('product-quantity').value);
                        addToCart(product, quantity);
                        $('#quantityModal').modal('hide');
                    });
                });
            });
        });

    // Añadir producto al carrito
    function addToCart(product, quantity) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }
        updateCart();
    }

    // Actualizar el carrito
    function updateCart() {
        cartItems.innerHTML = '';
        cart.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
            li.innerHTML = `
                ${item.title} x${item.quantity} - $${item.price * item.quantity}
                <span class="badge badge-primary badge-pill">$${item.price}</span>
            `;
            cartItems.appendChild(li);
        });
        cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    }

    // Generar factura en PDF
    paymentForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Validar datos del formulario
        const name = document.getElementById('name').value.trim();
        const cardNumber = document.getElementById('card-number').value.trim();
        const expirationDate = document.getElementById('expiration-date').value.trim();
        const cvv = document.getElementById('cvv').value.trim();

        if (!name || !cardNumber || !expirationDate || !cvv) {
            alert('Por favor, complete todos los campos.');
            return;
        }

        if (!/^\d{16}$/.test(cardNumber)) {
            alert('El número de tarjeta debe tener 16 dígitos.');
            return;
        }

        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expirationDate)) {
            alert('La fecha de expiración debe estar en formato MM/YY.');
            return;
        }

        if (!/^\d{3}$/.test(cvv)) {
            alert('El CVV debe tener 3 dígitos.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 20;

        // Fecha actual
        const currentDate = new Date();
        const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

        // Título de la factura
        doc.setFontSize(18);
        doc.text('Factura de Compra', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 10;

        // Fecha en la esquina derecha
        doc.setFontSize(12);
        doc.text(`Fecha: ${formattedDate}`, doc.internal.pageSize.getWidth() - 20, 10, { align: 'right' });

        // Línea divisoria
        doc.line(20, y + 2, doc.internal.pageSize.getWidth() - 20, y + 2);
        y += 10;

        // Detalles del cliente
        doc.text(`Cliente: ${name}`, 20, y);
        y += 10;

        // Línea divisoria
        doc.line(20, y + 2, doc.internal.pageSize.getWidth() - 20, y + 2);
        y += 10;

        // Productos comprados
        doc.text('Productos:', 20, y);
        y += 5;

        cart.forEach(item => {
            doc.text(`${item.title} x${item.quantity} - $${item.price * item.quantity}`, 20, y);
            y += 5;
        });

        // Línea divisoria
        doc.line(20, y + 2, doc.internal.pageSize.getWidth() - 20, y + 2);
        y += 10;

        // Total
        const total = cart.reduce((total, item) => total + item.price * item.quantity, 0);
        doc.text(`Total: $${total}`, 20, y);
        y += 10;

        // Datos de pago
        const lastFourDigits = cardNumber.slice(-4);
        doc.text(`Tarjeta: ****-****-****-${lastFourDigits}`, 20, y);

        doc.save('factura.pdf');
        $('#paymentModal').modal('hide');
        cart = [];
        updateCart();
    });

    // Formatear automáticamente la fecha de expiración
    expirationDateInput.addEventListener('input', (event) => {
        let value = event.target.value.replace(/[^0-9]/g, '');
        if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        event.target.value = value;
    });

    // Limitar el CVV a 3 dígitos
    cvvInput.addEventListener('input', (event) => {
        event.target.value = event.target.value.slice(0, 3);
    });
});
