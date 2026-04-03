<?php

namespace App\Imports;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class StudentImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public function __construct(
        private int $schoolId,
        private int $classId,
    ) {}

    public function model(array $row): ?Student
    {
        $name = trim($row['name'] ?? '');
        if (empty($name)) return null;

        return new Student([
            'name'             => $name,
            'school_id'        => $this->schoolId,
            'class_id'         => $this->classId,
            'dob'              => isset($row['dob']) ? $this->parseDate($row['dob']) : null,
            'admission_number' => $row['admission_number'] ?? null,
            'status'           => 'active',
        ]);
    }

    private function parseDate(mixed $value): ?string
    {
        if (is_numeric($value)) {
            return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d');
        }
        try {
            return \Carbon\Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }
}
