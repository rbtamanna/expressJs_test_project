/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('orders', function(table) {
        table.increments('id').primary();
        table.string('customer_name').notNullable();
        table.string('customer_email').notNullable();
        table.string('customer_phone').notNullable();
        table.string('customer_address').notNullable();
        table.decimal('price').notNullable();
        table.string('product_name').notNullable();
        table.string('product_details').notNullable();
        table.string('invoice_id').notNullable();
        table.string('status').notNullable();
        table.dateTime('created_at').nullable();
        table.dateTime('updated_at').nullable();
        table.dateTime('deleted_at').nullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('orders');
};
