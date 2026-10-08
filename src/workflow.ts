export type PatientData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  medicalId: string;
  gender: string;
  bloodType: string;
  allergies: string;
  medications: string;
  emergencyContact: string;
  emergencyPhone: string;
};

export const patient: PatientData = {
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: "1990-01-01",
  medicalId: "91927885",
  gender: "Male",
  bloodType: "O+",
  allergies: "None",
  medications: "None",
  emergencyContact: "Jane Doe",
  emergencyPhone: "555-010-1234",
};

export const workflowPrompt = `
You are a browser automation agent.

Fill in all three sections of the medical form using the patient data provided.
Open collapsed sections when necessary.
Use the appropriate tool for each field type, including dropdown menus.
Then submit the form.

Rules:
- Inspect the page before interacting.
- Use only the provided browser tools.
- Do not invent field names or values.
- After submitting, inspect the result and report whether it succeeded.
- For each collapsed section, click its heading and inspect the page again before filling its fields.
- For dropdowns, use selectOption and choose only an option reported by inspectPage.
`;