export type MerchantTheme = {
    primary: string;
    accent: string;
    surface: string;
};
export type Product = {
    id: string;
    name: string;
    game: string;
    sku: string;
    price: number;
    quantity: number;
    published: boolean;
};
export type Store = {
    id: string;
    name: string;
    slug: string;
    email: string;
    description: string;
    theme: MerchantTheme;
    products: Product[];
};
export const seedStores: Store[] = [
    { id: 'demo-north', name: 'Northstar Cards', slug: 'northstar-cards', email: 'hello@northstar.example', description: 'Trading cards, collectibles, and accessories.', theme: { primary: '#4d71e8', accent: '#95b4ff', surface: '#ffffff' }, products: [
            { id: 'p1', name: 'Starter Deck — Cosmic Clash', game: 'Pokémon', sku: 'PKM-001', price: 24.99, quantity: 18, published: true },
            { id: 'p2', name: 'Booster Pack — Wild Frontiers', game: 'Magic: The Gathering', sku: 'MTG-002', price: 6.49, quantity: 42, published: true },
            { id: 'p3', name: 'Card Sleeves (100 pack)', game: 'Accessories', sku: 'ACC-003', price: 9.99, quantity: 4, published: true },
            { id: 'p4', name: 'Collector Binder', game: 'Accessories', sku: 'ACC-004', price: 19.99, quantity: 0, published: false }
        ] },
    { id: 'demo-ember', name: 'Ember Guild Cards', slug: 'ember-guild', email: 'contact@ember.example', description: 'Your local tabletop and collectibles shop.', theme: { primary: '#d25d40', accent: '#f5b46e', surface: '#ffffff' }, products: [
            { id: 'p5', name: 'Duelist Deck — Shadow Arc', game: 'Yu-Gi-Oh!', sku: 'YGO-101', price: 19.99, quantity: 14, published: true },
            { id: 'p6', name: 'Pirate Booster Pack', game: 'One Piece', sku: 'OP-102', price: 5.99, quantity: 27, published: true }
        ] }
];
