'use strict';
import 'cross-fetch/polyfill';
import 'formdata-polyfill';
import 'promise-polyfill/src/polyfill';
import 'nodelist-foreach-polyfill';
import elementClosest from 'element-closest';
elementClosest(window);

const render = data => {
    // находим контейнер
    const container = document.querySelector('.container');
    // перебираем массив з элементами и деструктурируем
    data.forEach(element => {
        const {
            code,
            title,
            priceGold,
            priceGoldAlt,
            priceRetail,
            priceRetailAlt,
            primaryImageUrl,
            productId,
            bonusAmount,
            assocProducts,
            unit,
            unitAlt,
        } = element;

        const renderNeeded = assocProducts => {
            const arr = assocProducts.split('\n');
            let newElem = '';

            arr.forEach((elem, index) => {
                if (elem) {
                    if (index === arr.length - 1) {
                        newElem += `<a href="#">${elem.replace(
                            /[;.,]/g,
                            ''
                        )}</a>.`;
                    } else {
                        newElem += `<a href="#">${elem.replace(
                            /[;.,]/g,
                            ''
                        )}</a>, `;
                    }
                }
            });

            return newElem;
        };

        // создаем новый элемент
        const newElement = document.createElement('div');
        newElement.className = 'product';
        newElement.innerHTML = `
            <a href="#" class="product__status">Наличие</a>

            <div class="product__image">
                <img
                    src="${primaryImageUrl.replace('.jpg', '_220x220_1.jpg')}"
                    alt="photo"
                />
            </div>

            <div class="product__description">
                <span class="product__code">Код: <span>${code.slice(
                    5
                )}</span></span>
                <a href="#" class="product__title"
                    >${title}</a
                >
                <p class="product__needed">
                    <span>Могут понадобиться: </span>
                    ${renderNeeded(assocProducts)}
                </p>
            </div>

            <div class="product__price">
                <div class="price__wrap">
                    <span class="product__club"
                        >По карте <br />
                        клуба:</span
                    >
                    <span class="card__price active-price">${priceGoldAlt.toLocaleString(
                        'ru-Ru',
                        {
                            style: 'currency',
                            currency: 'RUB',
                        }
                    )}</span>
                    ${
                        unit === unitAlt
                            ? ''
                            : `
                    <span class="card__price">${priceGold.toLocaleString(
                        'ru-Ru',
                        {
                            style: 'currency',
                            currency: 'RUB',
                        }
                    )}</span>
                    `
                    }
                </div>

                <div class="price__wrap">
                    <span class="standart__price active-price">${priceRetailAlt.toLocaleString(
                        'ru-Ru',
                        {
                            style: 'currency',
                            currency: 'RUB',
                        }
                    )}</span>
                    ${
                        unit === unitAlt
                            ? ''
                            : `
                    <span class="standart__price">${priceRetail.toLocaleString(
                        'ru-Ru',
                        {
                            style: 'currency',
                            currency: 'RUB',
                        }
                    )}</span>
                    `
                    }
                </div>

                <p class="product__scores">
                    Можно купить за
                    <span class="score__price active-price">${bonusAmount}</span
                    > балла
                </p>

                <div class="product__tabs">
                    <span class="product__tab active-tab"
                        >За <span>${unitAlt}</span></span
                    >

                    ${
                        unit === unitAlt
                            ? ''
                            : `
                    <span class="product__tab"
                        >За <span>${unit}</span></span
                    >
                    `
                    }
                </div>

                <div class="product__tooltip">
                    <span class="tooltip__icon"></span>
                    <p class="tooltip__text">
                        Продётся упаковками: <br />
                        1 упак. = <span>2.47 м. кв.</span>
                    </p>
                </div>

                <div class="product__basket">
                    <div class="input__group">
                        <input
                            class="input"
                            type="number"
                            min="0"
                            value="0"
                        />
                        <div class="input__buttons">
                            <span class="button__plus"></span>
                            <span class="button__minus"></span>
                        </div>
                    </div>
                    <button data-product-id="${productId}" class="product__to-basket">В корзину</button>
                </div>
            </div>

        `;
        // вставляем полученные новые элементы в контейнер
        container.insertAdjacentElement('beforeend', newElement);
    });

    const cards = document.querySelectorAll('.product');
    cards.forEach(element => {
        element.addEventListener('click', event => {
            changeInputValue(event, element);
        });
    });

    const tabs = document.querySelectorAll('.product__tabs');
    tabs.forEach(element => {
        element.addEventListener('click', event => {
            toogleTabs(event);
        });
    });
};

const changeInputValue = (e, element) => {
    const target = e.target,
        input = element.querySelector('.input');
    if (target.matches('.product__to-basket')) {
        input.value = 0;
    }
    if (target.matches('.button__plus')) {
        input.value = +input.value + 1;
    } else if (target.matches('.button__minus')) {
        input.value = +input.value - 1;
        if (input.value < 0) {
            input.value = 0;
        }
    }
};

const toogleTabs = e => {
    const target = e.target,
        card = target.closest('.product'),
        tabs = card.querySelectorAll('.product__tab'),
        cardPrices = card.querySelectorAll('.card__price'),
        standartPrices = card.querySelectorAll('.standart__price');

    if (target.closest('.product__tab')) {
        tabs.forEach((item, index) => {
            if (item === target.closest('.product__tab')) {
                item.classList.add('active-tab');
                cardPrices[index].classList.add('active-price');
                standartPrices[index].classList.add('active-price');
            } else {
                item.classList.remove('active-tab');
                cardPrices[index].classList.remove('active-price');
                standartPrices[index].classList.remove('active-price');
            }
        });
    }
};

// запрос на сервер
const getData = () => {
    const url = 'dbproducts/products.json';

    fetch(url)
        .then(response => response.json())
        .then(data => render(data))
        .catch(err => console.log(err));
};
getData();
