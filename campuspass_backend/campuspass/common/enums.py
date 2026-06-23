from django.db import models


class UserRole(models.TextChoices):
    STUDENT = 'STUDENT', 'Student'
    FACULTY = 'FACULTY', 'Faculty Advisor'
    HOD = 'HOD', 'Head of Department'
    WARDEN = 'WARDEN', 'Warden'
    SECURITY = 'SECURITY', 'Security Personnel'
    ADMIN = 'ADMIN', 'Administrator'


class OutpassStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    FACULTY_APPROVED = 'FACULTY_APPROVED', 'Faculty Approved'
    HOD_APPROVED = 'HOD_APPROVED', 'HOD Approved'
    WARDEN_APPROVED = 'WARDEN_APPROVED', 'Warden Approved'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
    EXPIRED = 'EXPIRED', 'Expired'
    USED = 'USED', 'Used'
    CANCELLED = 'CANCELLED', 'Cancelled'


class ApprovalAction(models.TextChoices):
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
    PENDING = 'PENDING', 'Pending'
    FORWARDED = 'FORWARDED', 'Forwarded'


class VerificationResult(models.TextChoices):
    VALID = 'VALID', 'Valid'
    INVALID_TOKEN = 'INVALID_TOKEN', 'Invalid Token'
    NOT_APPROVED = 'NOT_APPROVED', 'Not Approved'
    EXPIRED = 'EXPIRED', 'Expired'
    ALREADY_USED = 'ALREADY_USED', 'Already Used'
    REVOKED = 'REVOKED', 'Revoked'
    STUDENT_INACTIVE = 'STUDENT_INACTIVE', 'Student Inactive'
    CANCELLED = 'CANCELLED', 'Cancelled'


class MovementType(models.TextChoices):
    EXIT = 'EXIT', 'Exit'
    ENTRY = 'ENTRY', 'Entry'


class NotificationType(models.TextChoices):
    OUTPASS_SUBMITTED = 'OUTPASS_SUBMITTED', 'Outpass Submitted'
    OUTPASS_APPROVED = 'OUTPASS_APPROVED', 'Outpass Approved'
    OUTPASS_REJECTED = 'OUTPASS_REJECTED', 'Outpass Rejected'
    QR_GENERATED = 'QR_GENERATED', 'QR Generated'
    STUDENT_EXITED = 'STUDENT_EXITED', 'Student Exited'
    STUDENT_RETURNED = 'STUDENT_RETURNED', 'Student Returned'
    APPROVAL_REQUEST = 'APPROVAL_REQUEST', 'Approval Request'
    PASS_EXPIRING = 'PASS_EXPIRING', 'Pass Expiring'


class AuditAction(models.TextChoices):
    LOGIN = 'LOGIN', 'Login'
    LOGOUT = 'LOGOUT', 'Logout'
    CREATE = 'CREATE', 'Create'
    UPDATE = 'UPDATE', 'Update'
    DELETE = 'DELETE', 'Delete'
    APPROVE = 'APPROVE', 'Approve'
    REJECT = 'REJECT', 'Reject'
    QR_GENERATE = 'QR_GENERATE', 'QR Generate'
    QR_VERIFY = 'QR_VERIFY', 'QR Verify'
    ENTRY_RECORD = 'ENTRY_RECORD', 'Entry Record'
    EXIT_RECORD = 'EXIT_RECORD', 'Exit Record'
    EXPIRY = 'EXPIRY', 'Expiry'
    CANCELLATION = 'CANCELLATION', 'Cancellation'


class Gender(models.TextChoices):
    MALE = 'M', 'Male'
    FEMALE = 'F', 'Female'
    OTHER = 'O', 'Other'


class HostelType(models.TextChoices):
    BOYS = 'BOYS', 'Boys Hostel'
    GIRLS = 'GIRLS', 'Girls Hostel'
    CO_ED = 'CO_ED', 'Co-Educational'
