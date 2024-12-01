/**
 * @file The parser for a simple, easy to read/write programming language built to replace JavaScript.
 * @author Jordan Castro <jordan@grupojvm.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "easyjs",

  // Define precedence and associativity
  precedences: $ => [
    [
      'member',
      'call',
      'unary',
      'binary',
      'primary',
      'range',
      'assign' 
    ],
    [
      $.member_access,
      $.await_expression,
      $.function_call,
      $.macro_call
    ]
  ],

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => repeat($.statement),

    // statements

    statement: $ => seq(
      choice(
        $.variable_statement,
        $.function_declaration,
        $.constant_declaration,
        $.struct_declaration,
        $.macro_declaration,
        $.expression_statement,
        $.return_statement,
        $.import_statement,
        $.for_statement,
        $.if_statement
      ),
      $.statement_separator
    ),

    // fn add(a,b) { return a + b}
    function_declaration: $ => seq(
      optional('async'),
      'fn',
      $.identifier,
      $.parameter_list,
      $.block
    ),

    // macro name(params) { body }
    macro_declaration: $ => seq(
      'macro',
      $.identifier,
      $.parameter_list,
      $.block
    ),

    // name = value
    variable_statement: $ => choice(
      seq(
        choice(
          $.identifier,
          $.member_access
        ),  // The identifier at the start of the statement
        '=',
        $.expression   // The expression assigned to the variable
      ),
      // name += value
      seq(
        choice(
          $.identifier,
          $.member_access
        ),
        choice('+=', '-=', '/=', '*='),
        $.expression
      )
    ),

    // name := alwaus value
    constant_declaration: $ => seq(
      $.identifier,
      ':=',
      $.expression
    ),

    // Rule for parsing a struct definition
    struct_declaration: $ => seq(
      'struct',
      $.identifier, // The name of the struct (e.g., Person)
      $.struct_body // The body of the struct (fields, methods, etc.)
    ),

    // Rule for parsing the struct body
    struct_body: $ => seq(
      '{',
      repeat($.struct_field),
      repeat($.function_declaration),
      '}'
    ),

    // Rule for parsing a struct field (name and value)
    struct_field: $ => seq(
      $.identifier,
      '=',
      $.expression, // Default value, which could be null, a number, a string, etc.
      '\n'
    ),

    // expression statement
    expression_statement: $ => seq(
      $.expression,
    ),

    // return value
    return_statement: $ => seq(
      'return',
      optional($.expression)
    ),

    // import statements
    import_statement: $ => choice(
      seq('use', $.import_path), // Simple import, e.g., use std:math
      seq('use', $.import_path, 'as', $.identifier), // Import with alias, e.g., use std:math as m
      seq('use', '{', $.identifier_list, '}', 'from', $.import_path), // Destructured import, e.g., use {add, sub} from std:math
    ),

    import_path: $ => 
      seq(
        $.import_prefix, ':', 
        choice(
          $.identifier_path,
          $.string // URL (think cdns, etc.)
        )
    ),

    import_prefix: $ => choice(
      'core',      // EasyJS Core library
      'runtime',   // Runtime-specific modules
      'npm',       // NPM modules
      'js',        // JavaScript files
      'browser',   // Browser-only modules
      'base',      // Self-hosted modules
    ),

    identifier_path: $ => seq($.identifier, repeat(seq('.', $.identifier))), // Handles paths like std:math.utils

    identifier_list: $ => seq($.identifier, repeat(seq(',', $.identifier))), // Handles {add, sub, mul}

    // for stmts
    for_statement: $ => seq('for', $.expression, $.block),                     // General conditional loop

    // if stmts
    if_statement: $ => seq(
      'if',
      $.expression,
      $.block,
      repeat($.elif_clause),
      optional($.else_clause)
    ),
    elif_clause: $ => seq('elif', $.expression, $.block),
    else_clause: $ => seq('else', $.block),

    // tokens

    // the identifier
    identifier: $ => /[a-zA-Z]([a-zA-Z0-9_])*/,

    // Token for numbers (e.g., 123, 3.14)
    number: $ => /\d+(\.\d+)?/,

    // Token for string literals using both single and double quotes
    string: $ => choice(
      seq('"', /[^"\\]*|\\./, '"'),
      seq("'", /[^'\\]*|\\./, "'")
    ),

    // Token for boolean literals (true/false)
    boolean: $ => choice('true', 'false'),

    // Rule for arrays, which can contain any valid expression
    array: $ => seq(
      '[',
      optional(seq($.expression, repeat(seq(',', $.expression)))),
      ']'
    ),

    // Rule for objects with key-value pairs
    object: $ => seq(
      '{',
      optional(seq(
        $.key_value_pair,
        repeat(seq(',', $.key_value_pair))
      )),
      '}'
    ),

    // Key-value pair for object literals
    key_value_pair: $ => seq(
      $.string,
      ':',
      $.expression
    ),

    block: $ => seq(
      '{',
      optional(repeat($.statement)),
      '}'
    ),

    // statement seperators
    statement_separator: $ => choice(
      '\n',         // Newline character
      ';'           // Semicolon
    ),

    // comments
    single_line_comment: $ => seq(
      '//',
      /[^\n]*/
    ),

    // expressions
    // Expression rule that can be any of the basic types
    expression: $ => choice(
      $.lambda_expression,
      prec.right('unary', $.await_expression),
      prec.left('member', $.member_access),
      prec.left('binary', $.binary_expression),
      prec.right('unary', $.bang_expression),
      $.range_expression,
      prec.left('member', $.subscript),
      $.in_expression,
      $.identifier,
      $.number,
      $.string,
      $.boolean,
      $.array,
      $.object,
      prec('call', $.function_call),
      prec('call', $.macro_call),
      $.single_line_comment
    ),

    // Define a binary expression
    binary_expression: $ => prec.left('binary', seq(
      $.expression,
      choice(
        '+',
        '-',
        '*',
        '/',
        '%',
        '==',
        '!=',
        '>',
        '<',
        '>=',
        '<=',
        '&&',
        '||',
        'and',
        'or'
      ),
      $.expression
    )),

    parameter_list: $ => seq(
      '(',
      commaSep($.identifier),
      ')'
    ),

    arguments: $ => seq(
      '(',
      commaSep($.expression),
      ')'
    ),

    // name := fn(params) { body }
    lambda_expression: $ => seq(
      'fn',
      $.parameter_list,
      $.block
    ),

    // calling functions
    function_call: $ => seq(
      $.identifier,
      '(',
      optional(commaSep($.expression)),
      ')'
    ),

    // calling macros
    macro_call: $ => seq(
      optional(choice('$', '@')),
      $.identifier,
      '(',
      optional(commaSep($.expression)),
      ')'
    ),

    member_access: $ => prec.left('member', seq(
      $.expression,
      '.',
      $.expression
    )),

    subscript: $ => prec.left('member', seq(
      $.expression, // The array or object being indexed
      '[',
      $.expression, // The index or key
      ']'
    )),

    // await expression with proper precedence
    await_expression: $ => prec.right('unary', seq(
      'await',
      $.expression
    )),

    // range expression
    range_expression: $ => prec.left('range', seq(
      $.expression,
      '..',
      $.expression
    )),

    in_expression: $ => prec.left(seq(
      $.expression,
      'in',
      $.expression
    )),

    bang_expression: $ => prec.right('unary', seq(
      choice('!', 'not'),
      $.expression
    )),

  }
});

// Helper function for comma-separated lists
function commaSep(rule) {
  return optional(seq(rule, repeat(seq(',', rule))));
}
