const { proto } = require('@whiskeysockets/baileys');
const { BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');

/**
 * Custom Auth State for Baileys using Supabase
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} sessionId - The tenant ID or session identifier
 */
const supabaseAuthState = async (supabase, sessionId) => {
    // 1. Fetch credentials (creds.json)
    const writeData = async (data, id) => {
        try {
            const { error } = await supabase
                .from('whatsapp_sessions')
                .upsert({
                    session_id: sessionId,
                    id: id,
                    data: JSON.stringify(data, BufferJSON.replacer),
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error(`[${sessionId}] Error writing auth data (${id}):`, error);
        }
    };

    const readData = async (id) => {
        try {
            const { data, error } = await supabase
                .from('whatsapp_sessions')
                .select('data')
                .eq('session_id', sessionId)
                .eq('id', id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                // console.error(`[${sessionId}] Error reading auth data (${id}):`, error);
                return null;
            }

            if (data && data.data) {
                return JSON.parse(data.data, BufferJSON.reviver);
            }
            return null;
        } catch (error) {
            console.error(`[${sessionId}] Error parsing auth data (${id}):`, error);
            return null;
        }
    };

    const removeData = async (id) => {
        try {
            const { error } = await supabase
                .from('whatsapp_sessions')
                .delete()
                .eq('session_id', sessionId)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error(`[${sessionId}] Error deleting auth data (${id}):`, error);
        }
    };

    // Initialize credentials
    const creds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(value, key));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: async () => {
            await writeData(creds, 'creds');
        },
    };
};

module.exports = supabaseAuthState;
