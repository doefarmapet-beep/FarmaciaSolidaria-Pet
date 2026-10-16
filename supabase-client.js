import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://eyvieqvxxsadcgddpcwq.supabase.co';
const supabasePublishableKey = 'sb_publishable_1GDDLmZwBFf1tC6gtXGWPg_d0V4wh4R';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export function formatSupabaseError(error) {
    if (error?.code === 'PGRST205' || error?.code === '42P01') {
        return 'O banco ainda não está configurado. Execute supabase/schema.sql no SQL Editor do Supabase.';
    }
    if (error?.code === '42501' || error?.code === 'PGRST301') {
        return 'Ação não permitida. Entre na sua conta e tente novamente.';
    }
    return error?.message || 'Não foi possível concluir a operação. Tente novamente.';
}

export function localDateString() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
}
