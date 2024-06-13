export const STATE_SELECTING_PIZZA             = 0
export const STATE_WAITING_FOR_PIZZA           = 200
export const STATE_MONITOR_PIZZA_ORDER         = 201
export const STATE_WAITING_FOR_BAKING_PIZZA    = 300
export const STATE_BAKING_PIZZA                = 301
export const STATE_PIZZA_BAKED                 = 400
export const STATE_PIZZA_WAITING_FOR_DELIVERY  = 401
export const STATE_PIZZA_IN_DELIVERY           = 500
export const STATE_PIZZA_PAID                  = 501
export const STATE_PIZZA_EVELUATED             = 600

export function getStateMessage(state)
{
  switch(state)
  {
    case STATE_SELECTING_PIZZA:
      return "Selecting Pizza";
    case STATE_WAITING_FOR_PIZZA:
      return "Waiting for pizza";
    case STATE_MONITOR_PIZZA_ORDER:
      return "Pizza order monitoring";
    case STATE_WAITING_FOR_BAKING_PIZZA:
      return "Waiting for baking";
    case STATE_BAKING_PIZZA:
      return "Baking";
    case STATE_PIZZA_BAKED:
      return "Baked";
    case STATE_PIZZA_WAITING_FOR_DELIVERY:
      return "Waiting for delivery";
    case STATE_PIZZA_IN_DELIVERY:
      return "In delvery";
    case STATE_PIZZA_PAID:
      return "Paid";
    case STATE_PIZZA_EVELUATED:
      return "Evaluated";
  }
}