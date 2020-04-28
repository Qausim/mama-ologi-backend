export const mockProduct1 = {
  title: 'Yam pepper pap',
  price: (99).toFixed(2),
  priceDenomination: 'NGN',
  weight: (2).toFixed(2),
  weightUnit: 'kg',
  description: 'Bless your tongue with nourishment',
};

export const productWithoutImages = {
  title: 'fake pap',
  price: (1900).toFixed(2),
  priceDenomination: 'NGN',
  weight: (20).toFixed(2),
  weightUnit: 'g',
  description: 'This is fake! You heard?! This is fake!!!',
  images: []
}

export const productWithImages = {
  title: 'fake pap with images',
  price: (1900).toFixed(2),
  priceDenomination: 'NGN',
  weight: (20).toFixed(2),
  weightUnit: 'g',
  description: 'This is fake! You heard?! This is fake!!!',
  images: ['fake-image1.png', 'fake-image2.png'],
};
