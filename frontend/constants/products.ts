export type Shade = { name: string; color: string };
export type Product = { name: string; shades: Shade[] };
export type Category = { id: string; name: string; icon: string; products: Product[] };
export type Selection = { category: string; product: string; shade: string; shadeColor: string };

export const CATEGORIES: Category[] = [
  {
    id: 'lips', name: 'Lèvres', icon: 'heart',
    products: [
      { name: 'Rouge à lèvres', shades: [
        { name: 'Rouge classique', color: '#CC0033' }, { name: 'Rose nude', color: '#D4A0A0' },
        { name: 'Berry', color: '#8B2252' }, { name: 'Coral', color: '#FF6F61' },
        { name: 'Mauve', color: '#9B6B8E' }, { name: 'Bordeaux', color: '#722F37' },
      ]},
      { name: 'Gloss', shades: [
        { name: 'Transparent', color: '#FFE4E1' }, { name: 'Rose', color: '#FFB6C1' },
        { name: 'Pêche', color: '#FFDAB9' }, { name: 'Rouge', color: '#FF4040' },
      ]},
    ]
  },
  {
    id: 'eyes', name: 'Yeux', icon: 'eye',
    products: [
      { name: 'Ombre à paupières', shades: [
        { name: 'Smoky noir', color: '#2C2C2C' }, { name: 'Bronze doré', color: '#CD853F' },
        { name: 'Terre naturelle', color: '#8B7355' }, { name: 'Bleu nuit', color: '#191970' },
        { name: 'Violet', color: '#6A0DAD' }, { name: 'Rose gold', color: '#B76E79' },
      ]},
      { name: 'Mascara', shades: [
        { name: 'Noir intense', color: '#000000' }, { name: 'Brun', color: '#5C4033' },
      ]},
      { name: 'Eyeliner', shades: [
        { name: 'Noir', color: '#000000' }, { name: 'Brun foncé', color: '#3E2723' },
        { name: 'Bleu marine', color: '#001F3F' },
      ]},
    ]
  },
  {
    id: 'face', name: 'Teint', icon: 'sunny',
    products: [
      { name: 'Fond de teint', shades: [
        { name: 'Porcelaine', color: '#FFE4C4' }, { name: 'Beige clair', color: '#F5DEB3' },
        { name: 'Beige doré', color: '#DEB887' }, { name: 'Caramel', color: '#C4956A' },
        { name: 'Noisette', color: '#A0785A' }, { name: 'Ébène', color: '#6B4423' },
      ]},
      { name: 'Correcteur', shades: [
        { name: 'Clair', color: '#FFEFD5' }, { name: 'Moyen', color: '#E8C39E' },
        { name: 'Foncé', color: '#B8860B' },
      ]},
    ]
  },
  {
    id: 'cheeks', name: 'Joues', icon: 'flower',
    products: [
      { name: 'Blush', shades: [
        { name: 'Rose tendre', color: '#FFB7C5' }, { name: 'Pêche', color: '#FFCBA4' },
        { name: 'Corail', color: '#FF7F50' }, { name: 'Berry', color: '#C71585' },
      ]},
      { name: 'Highlighter', shades: [
        { name: 'Champagne', color: '#F7E7CE' }, { name: 'Or rose', color: '#E8B4B8' },
        { name: 'Doré', color: '#FFD700' },
      ]},
      { name: 'Bronzer', shades: [
        { name: 'Soleil léger', color: '#D2AA6A' }, { name: 'Soleil intense', color: '#A67B5B' },
      ]},
    ]
  },
];
