from enum import Enum


class FormFieldType(str, Enum):
    TEXT = "TEXT"
    NUMBER = "NUMBER"
    EMAIL = "EMAIL"
    DATE = "DATE"
    DROPDOWN = "DROPDOWN"
    CHECKBOX = "CHECKBOX"
    RADIO = "RADIO"
    FILE = "FILE"
    RATING = "RATING"
    
class ConditionalOperator(str, Enum):
    EQUALS = "EQUALS"
    NOT_EQUALS = "NOT_EQUALS"
    CONTAINS = "CONTAINS"
    GREATER_THAN = "GREATER_THAN"
    LESS_THAN = "LESS_THAN"
    GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL"
    LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL"