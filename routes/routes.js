const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Get all routes
router.get('/', async (req, res) => {
    try {
        console.log('Fetching routes from Supabase...');
        const { data: routes, error } = await supabase
            .from('routes')
            .select('*')
            .order('route_name'); // Use 'route_name' column which exists in database

        console.log('Supabase response:', { routes, error });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch routes: ' + error.message 
            });
        }

        res.json({
            success: true,
            routes: routes || []
        });
    } catch (error) {
        console.error('Server error in routes endpoint:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message 
        });
    }
});

// Get route by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: route, error } = await supabase
            .from('routes')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !route) {
            return res.status(404).json({ 
                success: false, 
                error: 'Route not found' 
            });
        }

        res.json({
            success: true,
            route
        });
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

module.exports = router;
