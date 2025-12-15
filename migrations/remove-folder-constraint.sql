-- Migration: Remove check_folder_parent constraint
-- Date: 2025-12-15
-- Reason: Klasörler hem departmentId hem de subjectId'ye sahip olabilir

ALTER TABLE folders DROP CONSTRAINT IF EXISTS check_folder_parent;
