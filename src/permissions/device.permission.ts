export function canEditDevice(params: {
  user: any;
  registration: any;
  device: any;
}) {
  const { user, registration, device } = params;

  const isAdmin = user.role === "ADMIN";

  const isOwner = registration?.userId === user.id;
  const isRegisteredBy = registration?.registeredById === user.id;
  const isAssignedUser = device.userId === user.id;

  return isAdmin || isOwner || isRegisteredBy || isAssignedUser;
}

export function canDeleteDevice(params: {
  user: any;
  registration: any;
  device: any;
}) {
  return canEditDevice(params);
}