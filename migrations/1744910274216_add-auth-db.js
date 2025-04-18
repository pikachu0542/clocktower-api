const { password } = require('pg/lib/defaults');

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    pgm.createTable("users", {
        id: 'id',
        username: {
            type: 'varchar(80)',
            notNull: true,
            unique: true
        },
        created: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        password_hash: {
            type: 'CHAR(60)',
            notNull: true
        }
    })
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('users', {
        cascade: true
    })
};
