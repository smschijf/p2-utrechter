<?php
/**
 * Helper/Escaper functions for templates.
 */

/**
 * Escape string for Html.
 */
function eh($s)
{
    return htmlspecialchars($s);
}

/*
 * Escape string for Java Script.
 */
function ejs($s)
{
    return json_encode($s);
}

/*
 * Escape string for Query String.
 */
function eqs($s)
{
    return urlencode($s);
}

/*
 * Format Number.
 */
function fn($n)
{
    return number_format($n);
}

/*
 * Returns a string 'checked' when current exactly equals to candidate; for checkbox.
 */
function checked($current, $candidate)
{
    if (''.$current === ''.$candidate) {
        return 'checked';
    } else {
        return '';
    }
}

/*
 * Returns a string 'selected' when current exactly equals to candidate; for select.
 */
function selected($current, $candidate)
{
    if (''.$current === ''.$candidate) {
        return 'selected';
    } else {
        return '';
    }
}

