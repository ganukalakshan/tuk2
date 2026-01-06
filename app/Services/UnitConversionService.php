<?php

namespace App\Services;

use App\Models\MeasurementUnit;

class UnitConversionService
{
    /**
     * Convert quantity from one unit to another
     * 
     * @param float $quantity The quantity to convert
     * @param int $fromUnitId The source unit ID
     * @param int $toUnitId The target unit ID
     * @return float The converted quantity
     * @throws \Exception If units are incompatible or not found
     */
    public static function convert(float $quantity, int $fromUnitId, int $toUnitId): float
    {
        // If same unit, no conversion needed
        if ($fromUnitId === $toUnitId) {
            return $quantity;
        }

        $fromUnit = MeasurementUnit::find($fromUnitId);
        $toUnit = MeasurementUnit::find($toUnitId);

        if (!$fromUnit || !$toUnit) {
            throw new \Exception('One or both units not found');
        }

        // Convert to base unit first, then to target unit
        // conversion_to_base tells us how many base units = 1 of this unit
        // e.g., for gram: conversion_to_base = 0.001 (1g = 0.001 kg)
        // e.g., for kg (base): conversion_to_base = 1

        // Step 1: Convert from source unit to base unit
        $quantityInBase = $quantity * $fromUnit->conversion_to_base;

        // Step 2: Convert from base unit to target unit
        $result = $quantityInBase / $toUnit->conversion_to_base;

        return round($result, 4);
    }

    /**
     * Convert quantity to base unit
     * 
     * @param float $quantity The quantity to convert
     * @param int $unitId The source unit ID
     * @return float The quantity in base units
     */
    public static function toBaseUnit(float $quantity, int $unitId): float
    {
        $unit = MeasurementUnit::find($unitId);
        
        if (!$unit) {
            throw new \Exception('Unit not found');
        }

        return $quantity * $unit->conversion_to_base;
    }

    /**
     * Convert quantity from base unit to target unit
     * 
     * @param float $quantityInBase The quantity in base units
     * @param int $targetUnitId The target unit ID
     * @return float The converted quantity
     */
    public static function fromBaseUnit(float $quantityInBase, int $targetUnitId): float
    {
        $unit = MeasurementUnit::find($targetUnitId);
        
        if (!$unit) {
            throw new \Exception('Unit not found');
        }

        return $quantityInBase / $unit->conversion_to_base;
    }

    /**
     * Check if two units are compatible (can be converted)
     * Currently assumes all units in the same table are compatible.
     * In future, can add unit_type checking for mass, volume, etc.
     * 
     * @param int $unitId1 First unit ID
     * @param int $unitId2 Second unit ID
     * @return bool True if units are compatible
     */
    public static function areCompatible(int $unitId1, int $unitId2): bool
    {
        $unit1 = MeasurementUnit::find($unitId1);
        $unit2 = MeasurementUnit::find($unitId2);

        if (!$unit1 || !$unit2) {
            return false;
        }

        // For now, assume all units are compatible
        // In future, can check unit_type field if added
        return true;
    }

    /**
     * Get conversion factor between two units
     * 
     * @param int $fromUnitId Source unit ID
     * @param int $toUnitId Target unit ID
     * @return float The conversion factor (multiply source by this to get target)
     */
    public static function getConversionFactor(int $fromUnitId, int $toUnitId): float
    {
        if ($fromUnitId === $toUnitId) {
            return 1.0;
        }

        $fromUnit = MeasurementUnit::find($fromUnitId);
        $toUnit = MeasurementUnit::find($toUnitId);

        if (!$fromUnit || !$toUnit) {
            throw new \Exception('One or both units not found');
        }

        return $fromUnit->conversion_to_base / $toUnit->conversion_to_base;
    }

    /**
     * Format quantity with appropriate unit display
     * 
     * @param float $quantity The quantity
     * @param int $unitId The unit ID
     * @return string Formatted string like "1000 g" or "1.5 kg"
     */
    public static function formatWithUnit(float $quantity, int $unitId): string
    {
        $unit = MeasurementUnit::find($unitId);
        
        if (!$unit) {
            return number_format($quantity, 2);
        }

        return number_format($quantity, 2) . ' ' . $unit->unit_symbol;
    }
}
