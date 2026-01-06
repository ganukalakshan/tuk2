import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface MenuItem {
    id: number;
    code: string;
    name: string;
    category_id: number;
    department_id?: number;
    sale_type: 'kot' | 'bot' | 'both';
    prep_type: 'made_to_order' | 'ready_made';
    price: number;
    cost: number;
    is_active: boolean;
    display_order: number;
    image?: string;
    category?: {
        id: number;
        name: string;
    };
    department?: {
        store_id: number;
        name: string;
        key: string;
    };
    created_at: string;
    updated_at: string;
}

export interface Department {
    store_id: number;
    name: string;
    key: string;
    description?: string;
    is_active: boolean;
}

export interface Material {
    id: number;
    code?: string;
    name: string;
    category?: string;
    description?: string;
    is_active?: boolean;
    // any other fields you need
}

export interface MeasurementUnit {
    id: number;
    unit_name: string;
    unit_symbol: string;
    is_base?: boolean;
    conversion_to_base?: number;
}

export interface RecipeItem {
    id?: number;
    recipe_id?: number;
    material_id: number;
    unit_id: number;
    quantity: number | string;
    material?: Material;
    unit?: MeasurementUnit;
}

export interface Recipe {
    id?: number;
    menu_item_id?: number;
    version: string;
    standard_yield: number | string;
    instructions: string | null;
    is_current: boolean;
    created_by?: number | null;
    created_at?: string;
    updated_at?: string;
    items?: RecipeItem[];
}
