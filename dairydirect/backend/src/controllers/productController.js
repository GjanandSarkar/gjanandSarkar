// src/controllers/productController.js — Product Controller
import { supabase } from '../utils/supabase.js';
import { log } from '../utils/logger.js';

export const getAllProducts = async (req, res) => {
  try {
    const { category, search, limit = 10, offset = 0 } = req.query;

    let query = supabase.from('products').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({
        error: 'Failed to fetch products',
        message: error.message,
      });
    }

    res.json({
      message: 'Products retrieved',
      products: data,
      total: count,
    });
  } catch (error) {
    log.error('Get products error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    res.json({
      message: 'Product retrieved',
      product: data,
    });
  } catch (error) {
    log.error('Get product error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          description,
          price,
          category,
          stock,
        },
      ])
      .select();

    if (error) {
      return res.status(400).json({
        error: 'Creation failed',
        message: error.message,
      });
    }

    log.info('Product created:', data[0].id);

    res.status(201).json({
      message: 'Product created successfully',
      product: data[0],
    });
  } catch (error) {
    log.error('Create product error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
};
